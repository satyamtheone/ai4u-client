from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Union
import httpx
import os
from datetime import datetime
import uuid
import random

app = FastAPI(title="AI4U Backend with Learning Gates", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === EXISTING MODELS (UNCHANGED for backward compatibility) ===
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    # NEW: Optional learning gates control
    enable_learning_gates: Optional[bool] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message_id: str
    timestamp: datetime

class UserSession(BaseModel):
    session_id: str
    user_id: str
    messages: List[ChatMessage] = []
    created_at: datetime
    updated_at: datetime

# === NEW MODELS (Learning Gates) ===
class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str] = None
    difficulty: str  # easy, medium, hard
    topic: str

class LearningGateConfig(BaseModel):
    enabled: bool = True
    questions_per_gate: int = 3
    gate_frequency: int = 2
    difficulty: str = "mixed"
    topics: List[str] = ["JavaScript", "TypeScript", "Python"]

class UserProgress(BaseModel):
    user_id: str
    total_questions: int = 0
    correct_answers: int = 0
    streak: int = 0
    last_quiz_time: datetime
    unlocked_responses: int = 0
    level: int = 1
    message_count: int = 0

class QuizSubmission(BaseModel):
    question_id: str
    selected_answer: int
    user_id: str = "default"

# NEW: Enhanced response for learning gates
class EnhancedChatResponse(BaseModel):
    type: str = "chat_response"  # "chat_response" or "learning_gate"
    response: Optional[str] = None
    session_id: str
    message_id: Optional[str] = None
    timestamp: datetime
    # Learning gate fields
    question: Optional[QuizQuestion] = None
    stats: Optional[Dict] = None
    message: Optional[str] = None

# === STORAGE (EXISTING + NEW) ===
# Existing storage
sessions_db = {}
user_sessions = {}

# New storage for learning gates
user_progress_db: Dict[str, UserProgress] = {}

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# === QUESTION BANK ===
QUESTION_BANK: List[QuizQuestion] = [
    QuizQuestion(
        id="js-001",
        question="What does the 'const' keyword do in JavaScript?",
        options=[
            "Creates a variable that can be reassigned",
            "Creates a constant that cannot be reassigned", 
            "Creates a global variable",
            "Creates a function"
        ],
        correct_answer=1,
        explanation="The 'const' keyword creates a constant that cannot be reassigned after declaration.",
        difficulty="easy",
        topic="JavaScript"
    ),
    QuizQuestion(
        id="js-002", 
        question="Which method adds an element to the end of an array?",
        options=["push()", "pop()", "shift()", "unshift()"],
        correct_answer=0,
        explanation="The push() method adds one or more elements to the end of an array.",
        difficulty="easy",
        topic="JavaScript"
    ),
    QuizQuestion(
        id="py-001",
        question="How do you create a list in Python?",
        options=["list = {}", "list = []", "list = ()", "list = \"\""],
        correct_answer=1,
        explanation="Square brackets [] are used to create lists in Python.",
        difficulty="easy", 
        topic="Python"
    ),
    QuizQuestion(
        id="ts-001",
        question="What is TypeScript?",
        options=[
            "A JavaScript runtime",
            "A superset of JavaScript with static typing",
            "A database language", 
            "A CSS framework"
        ],
        correct_answer=1,
        explanation="TypeScript is a superset of JavaScript that adds static typing.",
        difficulty="medium",
        topic="TypeScript"
    ),
    QuizQuestion(
        id="ts-002",
        question="How do you define a function with optional parameters in TypeScript?",
        options=[
            "function myFunc(param: string?) {}",
            "function myFunc(param?: string) {}",
            "function myFunc(param: optional string) {}",
            "function myFunc([param]: string) {}"
        ],
        correct_answer=1,
        explanation="In TypeScript, optional parameters are defined using the '?' symbol after the parameter name.",
        difficulty="medium",
        topic="TypeScript"
    ),
    QuizQuestion(
        id="react-001",
        question="What is JSX in React?",
        options=[
            "A database query language",
            "A syntax extension for JavaScript",
            "A CSS framework",
            "A testing library"
        ],
        correct_answer=1,
        explanation="JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript.",
        difficulty="medium",
        topic="React"
    ),
    QuizQuestion(
        id="algo-001",
        question="What is the time complexity of binary search?",
        options=["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correct_answer=1,
        explanation="Binary search has O(log n) time complexity because it halves the search space in each iteration.",
        difficulty="hard",
        topic="Algorithms"
    ),
    QuizQuestion(
        id="algo-002",
        question="Which sorting algorithm has the best average-case time complexity?",
        options=["Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"],
        correct_answer=2,
        explanation="Merge Sort has O(n log n) time complexity in all cases, making it consistently efficient.",
        difficulty="hard",
        topic="Algorithms"
    )
]

# === LEARNING GATES LOGIC ===
def get_user_progress(user_id: str) -> UserProgress:
    """Get or create user progress"""
    if user_id not in user_progress_db:
        user_progress_db[user_id] = UserProgress(
            user_id=user_id,
            last_quiz_time=datetime.now()
        )
    return user_progress_db[user_id]

def should_show_gate(user_id: str, gate_frequency: int = 2) -> bool:
    """Determine if learning gate should be shown"""
    progress = get_user_progress(user_id)
    
    # Check if user has unlocked responses remaining
    if progress.unlocked_responses > 0:
        progress.unlocked_responses -= 1
        return False
    
    # Show gate based on frequency
    progress.message_count += 1
    return progress.message_count % gate_frequency == 0

def get_quiz_question(difficulty: str = "mixed", topics: List[str] = None) -> Optional[QuizQuestion]:
    """Get random quiz question"""
    available_questions = QUESTION_BANK.copy()
    
    # Filter by difficulty
    if difficulty != "mixed":
        available_questions = [q for q in available_questions if q.difficulty == difficulty]
    
    # Filter by topics
    if topics:
        available_questions = [q for q in available_questions if q.topic in topics]
    
    if not available_questions:
        return None
        
    return random.choice(available_questions)

def submit_quiz_answer(user_id: str, question_id: str, selected_answer: int) -> Dict:
    """Process quiz answer and update progress"""
    progress = get_user_progress(user_id)
    question = next((q for q in QUESTION_BANK if q.id == question_id), None)
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    correct = selected_answer == question.correct_answer
    
    # Update progress
    progress.total_questions += 1
    progress.last_quiz_time = datetime.now()
    
    if correct:
        progress.correct_answers += 1
        progress.streak += 1
        
        # Calculate unlocked responses based on streak
        bonus_responses = progress.streak // 3
        progress.unlocked_responses = 3 + bonus_responses
    else:
        progress.streak = 0
        progress.unlocked_responses = 1
    
    # Check for level up
    old_level = progress.level
    progress.level = (progress.correct_answers // 10) + 1
    level_up = progress.level > old_level
    
    return {
        "correct": correct,
        "explanation": question.explanation,
        "unlocked_responses": progress.unlocked_responses,
        "level_up": level_up,
        "new_level": progress.level if level_up else None
    }

def get_user_stats(user_id: str) -> Dict:
    """Get user learning statistics"""
    progress = get_user_progress(user_id)
    accuracy = (progress.correct_answers / progress.total_questions * 100) if progress.total_questions > 0 else 0
    
    return {
        "level": progress.level,
        "currentStreak": progress.streak,
        "accuracy": round(accuracy),
        "totalQuestions": progress.total_questions,
        "unlockedResponses": progress.unlocked_responses
    }

# === API ENDPOINTS ===

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest, learning_gates: bool = Query(False, description="Enable learning gates for this request")):
    """
    ENHANCED: Handle chat requests with optional learning gates
    Backward compatible - learning gates only activate when explicitly enabled
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    user_id = request.user_id or "anonymous"
    
    # NEW: Check learning gates if enabled
    if learning_gates or request.enable_learning_gates:
        if should_show_gate(user_id):
            question = get_quiz_question()
            if question:
                stats = get_user_stats(user_id)
                return EnhancedChatResponse(
                    type="learning_gate",
                    session_id=request.session_id or str(uuid.uuid4()),
                    timestamp=datetime.now(),
                    question=question,
                    stats=stats,
                    message="Complete this quiz to unlock AI responses!"
                )
    
    # EXISTING: Normal chat processing (unchanged)
    session_id = request.session_id or str(uuid.uuid4())
    
    if session_id not in sessions_db:
        sessions_db[session_id] = UserSession(
            session_id=session_id,
            user_id=user_id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    session = sessions_db[session_id]
    
    user_message = ChatMessage(
        role="user",
        content=request.message,
        timestamp=datetime.now()
    )
    session.messages.append(user_message)
    
    openai_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in session.messages[-10:]
    ]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OPENAI_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": openai_messages,
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"OpenAI API error: {response.text}"
                )
            
            openai_response = response.json()
            ai_message_content = openai_response["choices"][0]["message"]["content"]
        
        ai_message = ChatMessage(
            role="assistant",
            content=ai_message_content,
            timestamp=datetime.now()
        )
        session.messages.append(ai_message)
        session.updated_at = datetime.now()
        
        message_id = str(uuid.uuid4())
        
        # Return enhanced response for compatibility
        if learning_gates or request.enable_learning_gates:
            return EnhancedChatResponse(
                type="chat_response",
                response=ai_message_content,
                session_id=session_id,
                message_id=message_id,
                timestamp=datetime.now()
            )
        else:
            # Return original format for backward compatibility
            return ChatResponse(
                response=ai_message_content,
                session_id=session_id,
                message_id=message_id,
                timestamp=datetime.now()
            )
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# === NEW LEARNING GATES ENDPOINTS ===

@app.post("/api/quiz/submit")
async def submit_quiz(submission: QuizSubmission):
    """Submit quiz answer"""
    try:
        result = submit_quiz_answer(
            submission.user_id,
            submission.question_id, 
            submission.selected_answer
        )
        
        stats = get_user_stats(submission.user_id)
        
        return {
            "result": result,
            "updated_stats": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz submission error: {str(e)}")

@app.post("/api/quiz/skip")
async def skip_quiz(user_id: str = "default"):
    """Skip quiz - give limited response"""
    progress = get_user_progress(user_id)
    progress.unlocked_responses = 1
    
    stats = get_user_stats(user_id)
    
    return {
        "result": {
            "correct": False,
            "explanation": "Quiz skipped - you get 1 limited response.",
            "unlocked_responses": 1,
            "level_up": False
        },
        "updated_stats": stats
    }

@app.get("/api/user/stats/{user_id}")
async def get_stats(user_id: str):
    """Get user learning statistics"""
    return get_user_stats(user_id)

@app.get("/api/user/progress/{user_id}")
async def get_progress(user_id: str):
    """Get detailed user progress"""
    progress = get_user_progress(user_id)
    return progress.dict()

@app.post("/api/user/reset/{user_id}")
async def reset_progress(user_id: str):
    """Reset user learning progress"""
    if user_id in user_progress_db:
        del user_progress_db[user_id]
    return {"message": "Progress reset successfully"}

@app.get("/api/questions")
async def get_questions(difficulty: str = "mixed", topic: str = None):
    """Get available questions (for admin/debug)"""
    questions = QUESTION_BANK.copy()
    
    if difficulty != "mixed":
        questions = [q for q in questions if q.difficulty == difficulty]
    
    if topic:
        questions = [q for q in questions if q.topic == topic]
    
    # Don't return correct answers for security
    safe_questions = []
    for q in questions:
        safe_q = q.dict()
        safe_q.pop('correct_answer', None)
        safe_q.pop('explanation', None)
        safe_questions.append(safe_q)
    
    return {"questions": len(questions), "data": safe_questions}

# === EXISTING ENDPOINTS (UNCHANGED) ===

@app.get("/api/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions_db[session_id]
    return {
        "session_id": session_id,
        "messages": session.messages,
        "created_at": session.created_at,
        "updated_at": session.updated_at
    }

@app.delete("/api/chat/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a chat session"""
    if session_id in sessions_db:
        del sessions_db[session_id]
        return {"message": "Session cleared successfully"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "2.0.0",
        "features": ["chat", "learning_gates", "progress_tracking"],
        "backward_compatible": True
    }

@app.get("/api/sessions")
async def list_sessions():
    """List all active sessions (for debugging)"""
    return {
        "active_sessions": len(sessions_db),
        "sessions": list(sessions_db.keys()),
        "learning_users": len(user_progress_db)
    }

# === NEW ADMIN ENDPOINTS ===

@app.get("/api/admin/stats")
async def admin_stats():
    """Get overall system statistics"""
    total_users = len(user_progress_db)
    total_questions_answered = sum(p.total_questions for p in user_progress_db.values())
    total_correct = sum(p.correct_answers for p in user_progress_db.values())
    
    return {
        "total_users": total_users,
        "total_questions_answered": total_questions_answered,
        "total_correct_answers": total_correct,
        "overall_accuracy": round((total_correct / total_questions_answered * 100) if total_questions_answered > 0 else 0),
        "question_bank_size": len(QUESTION_BANK),
        "active_sessions": len(sessions_db)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)