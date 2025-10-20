from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, Dict, Any, List
import uuid
import httpx
import structlog

from models.learning import ChatSession, ChatMessage
from models.user import User
from schemas.learning import ChatRequest, ChatResponse, QuizQuestionSafe
from services.learning_service import LearningService
from services.activity_service import ActivityService
from models.activity_log import ActivityActionEnum
from core.config import settings

logger = structlog.get_logger(__name__)

class ChatService:
    """Service for AI chat with learning gates integration"""
    
    def __init__(self, db: Session):
        self.db = db
        self.learning_service = LearningService(db)
        self.activity_service = ActivityService(db)
    
    async def process_chat_request(
        self,
        request: ChatRequest,
        user_id: uuid.UUID,
        organization_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> ChatResponse:
        """Process chat request with learning gates integration"""
        try:
            # Get or create chat session
            session = await self._get_or_create_session(
                user_id, request.session_id, organization_id, request
            )
            
            # Check learning gates if enabled
            if request.enable_learning_gates:
                gate_frequency = request.gate_frequency or session.gate_frequency
                
                if self.learning_service.should_show_gate(
                    user_id, organization_id, gate_frequency
                ):
                    question = self.learning_service.get_quiz_question(user_id, organization_id)
                    
                    if question:
                        stats = self.learning_service.get_user_stats(user_id, organization_id)
                        
                        # Create quiz message record
                        quiz_message = ChatMessage(
                            session_id=session.id,
                            role="system",
                            content="Learning gate triggered",
                            message_type="quiz",
                            metadata={"question_id": str(question.id)}
                        )
                        self.db.add(quiz_message)
                        self.db.commit()
                        
                        return ChatResponse(
                            type="learning_gate",
                            session_id=session.id,
                            timestamp=quiz_message.created_at,
                            question=QuizQuestionSafe.from_orm(question),
                            stats=stats,
                            message="Complete this quiz to unlock AI responses!"
                        )
            
            # Process normal chat
            return await self._process_normal_chat(
                session, request, user_id, organization_id, ip_address, user_agent
            )
            
        except Exception as e:
            logger.error("Failed to process chat request", 
                        user_id=str(user_id), error=str(e))
            raise
    
    async def _get_or_create_session(
        self,
        user_id: uuid.UUID,
        session_id: Optional[uuid.UUID],
        organization_id: Optional[uuid.UUID],
        request: ChatRequest
    ) -> ChatSession:
        """Get existing session or create new one"""
        try:
            if session_id:
                session = self.db.query(ChatSession).filter(
                    and_(
                        ChatSession.id == session_id,
                        ChatSession.user_id == user_id
                    )
                ).first()
                
                if session:
                    # Update session settings if provided
                    if request.enable_learning_gates is not None:
                        session.learning_gates_enabled = request.enable_learning_gates
                    if request.gate_frequency:
                        session.gate_frequency = request.gate_frequency
                    
                    self.db.commit()
                    return session
            
            # Create new session
            session = ChatSession(
                user_id=user_id,
                organization_id=organization_id,
                session_token=str(uuid.uuid4()),
                learning_gates_enabled=request.enable_learning_gates or False,
                gate_frequency=request.gate_frequency or 2
            )
            
            self.db.add(session)
            self.db.commit()
            
            logger.info("Created new chat session", 
                       user_id=str(user_id), 
                       session_id=str(session.id))
            
            return session
            
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to get/create session", user_id=str(user_id), error=str(e))
            raise
    
    async def _process_normal_chat(
        self,
        session: ChatSession,
        request: ChatRequest,
        user_id: uuid.UUID,
        organization_id: Optional[uuid.UUID],
        ip_address: Optional[str],
        user_agent: Optional[str]
    ) -> ChatResponse:
        """Process normal AI chat without learning gate"""
        try:
            # Add user message to session
            user_message = ChatMessage(
                session_id=session.id,
                role="user",
                content=request.message,
                message_type="text"
            )
            self.db.add(user_message)
            
            # Get recent conversation history
            recent_messages = self.db.query(ChatMessage).filter(
                ChatMessage.session_id == session.id
            ).order_by(ChatMessage.created_at.desc()).limit(10).all()
            
            # Prepare messages for OpenAI API
            openai_messages = []
            for msg in reversed(recent_messages):
                if msg.message_type == "text":
                    openai_messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
            
            # Add current message
            openai_messages.append({
                "role": "user",
                "content": request.message
            })
            # Call OpenAI API
            ai_response = await self._call_openai_api(openai_messages)
            
            # Add AI response to session
            ai_message = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=ai_response,
                message_type="text"
            )
            self.db.add(ai_message)
            self.db.commit()
            
            # Log activity
            self.activity_service.log_activity(
                user_id=user_id,
                organization_id=organization_id,
                action=ActivityActionEnum("chat_message"),
                resource_type="chat_session",
                resource_id=session.id,
                metadata={
                    "message_length": len(request.message),
                    "response_length": len(ai_response),
                    "learning_gates_enabled": session.learning_gates_enabled
                },
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            return ChatResponse(
                type="chat_response",
                response=ai_response,
                session_id=session.id,
                message_id=ai_message.id,
                timestamp=ai_message.created_at
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to process normal chat", 
                        session_id=str(session.id), error=str(e))
            raise
    
    async def _call_openai_api(self, messages: List[Dict[str, str]]) -> str:
        """Call OpenAI API for chat completion or return default response"""
        try:
            # Check if OpenAI API key is configured
            if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "":
                logger.warning("OpenAI API key not configured, returning default response")
                return self._generate_default_response(messages)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": messages,
                        "max_tokens": 500,
                        "temperature": 0.7
                    },
                    timeout=30.0
                )

                if response.status_code != 200:
                    logger.error(f"OpenAI API error: {response.status_code}, falling back to default response")
                    return self._generate_default_response(messages)

                result = response.json()
                return result["choices"][0]["message"]["content"]

        except httpx.TimeoutException:
            logger.error("OpenAI API timeout, returning default response")
            return self._generate_default_response(messages)
        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}, returning default response")
            return self._generate_default_response(messages)

    def _generate_default_response(self, messages: List[Dict[str, str]]) -> str:
        """Generate a default response when OpenAI API is not available"""
        user_message = messages[-1]["content"] if messages else ""

        # Smart default responses based on keywords
        message_lower = user_message.lower()

        if any(word in message_lower for word in ["hello", "hi", "hey", "greetings"]):
            return "Hello! I'm here to help you learn. OpenAI integration is currently not configured, but I can still assist you with basic responses and learning quizzes."

        elif any(word in message_lower for word in ["help", "assist", "support"]):
            return "I can help you with:\n• Learning through interactive quizzes\n• Tracking your progress and stats\n• Providing educational content\n\nNote: Full AI capabilities require OpenAI API configuration. Please contact your administrator."

        elif any(word in message_lower for word in ["what", "how", "why", "explain"]):
            return f"Thank you for your question: '{user_message}'\n\nI'm currently running in demo mode without OpenAI integration. To get AI-powered answers, please configure the OpenAI API key in your environment settings.\n\nIn the meantime, you can:\n• Complete learning quizzes to earn points\n• Track your learning progress\n• Practice with educational content"

        elif any(word in message_lower for word in ["quiz", "question", "test", "learn"]):
            return "Great! You're interested in learning. Try accessing the quiz endpoints to get personalized questions and track your progress. Learning gates are active to help you learn effectively!"

        elif any(word in message_lower for word in ["thank", "thanks"]):
            return "You're welcome! Keep learning and improving your skills. Complete quizzes to unlock more responses!"

        elif any(word in message_lower for word in ["bye", "goodbye", "see you"]):
            return "Goodbye! Keep up the great learning progress. See you next time!"

        else:
            return f"I received your message: '{user_message}'\n\nI'm currently running in demo mode. Full AI-powered responses require OpenAI API configuration.\n\nWhat I can do:\n✓ Provide learning quizzes\n✓ Track your progress\n✓ Manage learning gates\n✓ Give you statistics\n\nTo unlock full AI capabilities, please configure the OPENAI_API_KEY in your environment."
