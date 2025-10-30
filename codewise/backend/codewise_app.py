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

class QuizQuestion(BaseModel):
    id: str
    question: str
    question_type: str = "single_choice"  # NEW: single_choice, multiple_choice, short_answer
    options: Optional[List[str]] = None   # For choice questions
    correct_answer: Optional[int] = None  # For single choice
    correct_answers: Optional[List[int]] = None  # For multiple choice
    keywords: Optional[List[str]] = None  # For short answer scoring
    max_length: Optional[int] = None      # For short answer
    explanation: Optional[str] = None
    difficulty: str
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

class BatchQuizSubmission(BaseModel):
    answers: List[Dict[str, Union[str, int]]]  # [{"question_id": "js-001", "selected_answer": 1}]
    user_id: str = "default"

class BatchQuizResult(BaseModel):
    question_id: str
    correct: bool
    selected_answer: int
    correct_answer: int
    explanation: Optional[str] = None
    points_earned: int = 0

# === STORAGE (EXISTING + NEW) ===
# Existing storage
sessions_db = {}
user_sessions = {}

# New storage for learning gates
user_progress_db: Dict[str, UserProgress] = {}

# Configuration
OPENAI_API_KEY = "Testing"#os.getenv("OPENAI_API_KEY")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# === QUESTION BANK ===
QUESTION_BANK: List[QuizQuestion] = [
    QuizQuestion(
        id="js-001",
        question="What does the 'const' keyword do in JavaScript?",
        question_type="single_choice",
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
    # QuizQuestion(
    #     id="js-002", 
    #     question="Which method adds an element to the end of an array?",
    #     question_type="multiple_choice",
    #     options=["push()", "pop()", "shift()", "unshift()"],
    #     correct_answer=0,
    #     explanation="The push() method adds one or more elements to the end of an array.",
    #     difficulty="easy",
    #     topic="JavaScript"
    # ),
    QuizQuestion(
        id="py-001",
        question="How do you create a list in Python?",
        question_type="multiple_choice",
        options=["list = {}", "list = []", "list = ()", "list = \"\""],
        correct_answers=[0, 1, 2],
        explanation="Square brackets [] are used to create lists in Python.",
        difficulty="easy", 
        topic="Python"
    ),
    QuizQuestion(
        id="ts-001",
        question="What is TypeScript?",
        question_type="short_answer",
        max_length=200,
        keywords=["function", "scope", "variable"],
        correct_answer=1,
        explanation="TypeScript is a superset of JavaScript that adds static typing.",
        difficulty="medium",
        topic="TypeScript"
    ),
    # QuizQuestion(
    #     id="ts-002",
    #     question="How do you define a function with optional parameters in TypeScript?",
    #     options=[
    #         "function myFunc(param: string?) {}",
    #         "function myFunc(param?: string) {}",
    #         "function myFunc(param: optional string) {}",
    #         "function myFunc([param]: string) {}"
    #     ],
    #     correct_answer=1,
    #     explanation="In TypeScript, optional parameters are defined using the '?' symbol after the parameter name.",
    #     difficulty="medium",
    #     topic="TypeScript"
    # ),
    # QuizQuestion(
    #     id="react-001",
    #     question="What is JSX in React?",
    #     options=[
    #         "A database query language",
    #         "A syntax extension for JavaScript",
    #         "A CSS framework",
    #         "A testing library"
    #     ],
    #     correct_answer=1,
    #     explanation="JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript.",
    #     difficulty="medium",
    #     topic="React"
    # ),
    # QuizQuestion(
    #     id="algo-001",
    #     question="What is the time complexity of binary search?",
    #     options=["O(n)", "O(log n)", "O(n²)", "O(1)"],
    #     correct_answer=1,
    #     explanation="Binary search has O(log n) time complexity because it halves the search space in each iteration.",
    #     difficulty="hard",
    #     topic="Algorithms"
    # ),
    # QuizQuestion(
    #     id="algo-002",
    #     question="Which sorting algorithm has the best average-case time complexity?",
    #     options=["Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"],
    #     correct_answer=2,
    #     explanation="Merge Sort has O(n log n) time complexity in all cases, making it consistently efficient.",
    #     difficulty="hard",
    #     topic="Algorithms"
    # )
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

@app.post("/api/v1/learning/chat")
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
            question = await get_quiz_question()
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

@app.post("/api/v1/learning/submit")
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

@app.post("/api/v1/learning/skip")
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

@app.get("/api/v1/user/stats/{user_id}")
async def get_stats(user_id: str):
    """Get user learning statistics"""
    return get_user_stats(user_id)

@app.get("/api/v1/user/progress/{user_id}")
async def get_progress(user_id: str):
    """Get detailed user progress"""
    progress = get_user_progress(user_id)
    return progress.dict()

@app.post("/api/v1/user/reset/{user_id}")
async def reset_progress(user_id: str):
    """Reset user learning progress"""
    if user_id in user_progress_db:
        del user_progress_db[user_id]
    return {"message": "Progress reset successfully"}

@app.get("/api/v1/questions")
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

@app.get("/api/v1/chat/history/{session_id}")
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

@app.delete("/api/v1/chat/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a chat session"""
    if session_id in sessions_db:
        del sessions_db[session_id]
        return {"message": "Session cleared successfully"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "2.0.0",
        "features": ["chat", "learning_gates", "progress_tracking"],
        "backward_compatible": True
    }

@app.get("/api/v1/sessions")
async def list_sessions():
    """List all active sessions (for debugging)"""
    return {
        "active_sessions": len(sessions_db),
        "sessions": list(sessions_db.keys()),
        "learning_users": len(user_progress_db)
    }

# === NEW ADMIN ENDPOINTS ===

@app.get("/api/v1/admin/stats")
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

@app.get("/api/v1/quiz/question")
async def get_quiz_question(user_id: str = "default"):
    """Get a random quiz question for the user"""
    # Your logic to select appropriate question based on:
    # - User's level/progress
    # - Difficulty preferences
    # - Topics they need to work on
    # - Questions they haven't seen recently
    question = random.choice(QUESTION_BANK)
    return {"question": question}

@app.get("/api/v1/quiz/info")
async def get_question_bank_info():
    """Get metadata about the question bank"""
    return {
        "total_questions": 500,
        "topics": ["JavaScript", "Python", "Data Structures", "Algorithms"],
        "difficulties": ["easy", "medium", "hard"],
        "last_updated": "2024-08-15"
    }

@app.get("/api/v1/learning/questions")
async def get_quiz_questions(count: int = 3, user_id: str = "default"):
    """Get multiple quiz questions for batch quiz"""
    if count > 10:  # Limit maximum questions
        count = 10
    
    # Get user progress to personalize question selection
    progress = get_user_progress(user_id)
    
    # Smart question selection based on user level
    available_questions = QUESTION_BANK.copy()
    
    # Filter by user level (mix of difficulties)
    if progress.level <= 2:
        # Beginners get more easy questions
        easy_questions = [q for q in available_questions if q.difficulty == "easy"]
        medium_questions = [q for q in available_questions if q.difficulty == "medium"]
        selected = random.sample(easy_questions, min(count-1, len(easy_questions)))
        if len(selected) < count and medium_questions:
            selected.extend(random.sample(medium_questions, min(count-len(selected), len(medium_questions))))
    elif progress.level <= 5:
        # Intermediate users get mixed difficulties
        easy_questions = [q for q in available_questions if q.difficulty == "easy"]
        medium_questions = [q for q in available_questions if q.difficulty == "medium"]
        hard_questions = [q for q in available_questions if q.difficulty == "hard"]
        
        # Mix: 1 easy, 1-2 medium, 0-1 hard
        selected = []
        if easy_questions:
            selected.extend(random.sample(easy_questions, min(1, len(easy_questions))))
        if medium_questions:
            selected.extend(random.sample(medium_questions, min(count-1, len(medium_questions))))
        if len(selected) < count and hard_questions:
            selected.extend(random.sample(hard_questions, min(count-len(selected), len(hard_questions))))
    else:
        # Advanced users get more challenging questions
        medium_questions = [q for q in available_questions if q.difficulty == "medium"]
        hard_questions = [q for q in available_questions if q.difficulty == "hard"]
        selected = random.sample(medium_questions + hard_questions, min(count, len(medium_questions + hard_questions)))
    
    # Ensure we have enough questions
    if len(selected) < count:
        remaining = random.sample(available_questions, min(count - len(selected), len(available_questions)))
        selected.extend([q for q in remaining if q not in selected])
    
    # Limit to requested count
    selected = selected[:count]
    
    return {"questions": selected}

@app.post("/api/v1/learning/submit-batch")
async def submit_batch_quiz(submission: dict):
    """Process enhanced quiz submissions with multiple question types"""
    try:
        user_id = submission.get("user_id", "default")
        answers = submission.get("answers", [])
        
        results = []
        total_correct = 0
        total_points = 0
        
        for answer_data in answers:
            question_id = answer_data["question_id"]
            answer_type = answer_data["answer_type"]
            selected_answer = answer_data["selected_answer"]
            
            question = next((q for q in QUESTION_BANK if q.id == question_id), None)
            if not question:
                continue
            
            # Process based on question type
            if answer_type == "single_choice":
                correct = selected_answer == question.correct_answer
            elif answer_type == "multiple_choice":
                # Check if all selected answers are correct and no incorrect ones
                correct_set = set(question.correct_answers or [])
                selected_set = set(selected_answer if isinstance(selected_answer, list) else [])
                correct = correct_set == selected_set and len(selected_set) > 0
            elif answer_type == "short_answer":
                # Simple keyword matching (you can enhance this)
                answer_text = str(selected_answer).lower().strip()
                keywords = question.keywords or []
                correct = any(keyword.lower() in answer_text for keyword in keywords)
            else:
                correct = False
            
            points = 0
            if correct:
                total_correct += 1
                # Enhanced scoring based on question type
                if answer_type == "short_answer":
                    points = 3  # Higher points for text answers
                elif answer_type == "multiple_choice":
                    points = 2  # Medium points for multiple choice
                else:
                    points = 1  # Standard points for single choice
                
                # Difficulty multiplier
                if question.difficulty == "hard":
                    points *= 2
                elif question.difficulty == "medium":
                    points = int(points * 1.5)
                
                total_points += points
            
            result = {
                "question_id": question_id,
                "correct": correct,
                "selected_answer": selected_answer,
                "correct_answer": question.correct_answer if answer_type == "single_choice" else question.correct_answers,
                "answer_type": answer_type,
                "explanation": question.explanation,
                "points_earned": points
            }
            results.append(result)
        
        # Enhanced progress calculation
        progress = get_user_progress(user_id)
        progress.total_questions += len(answers)
        progress.correct_answers += total_correct
        progress.last_quiz_time = datetime.now()
        
        # Smart response allocation based on performance and question types
        if total_correct == len(answers):
            # Perfect score
            progress.streak += len(answers)
            base_responses = total_points  # Points = responses
            bonus_responses = progress.streak // 3
            progress.unlocked_responses = base_responses + bonus_responses
        elif total_correct >= len(answers) * 0.7:  # 70% or better
            progress.streak = max(0, progress.streak - 1)
            progress.unlocked_responses = total_points + 2  # Points + bonus
        elif total_correct > 0:
            progress.streak = max(0, progress.streak - 2)
            progress.unlocked_responses = max(1, total_points)  # At least 1
        else:
            progress.streak = 0
            progress.unlocked_responses = 1
        
        # Level calculation
        old_level = progress.level
        progress.level = (progress.correct_answers // 15) + 1  # Adjusted for harder questions
        level_up = progress.level > old_level
        
        # Return enhanced results
        return {
            "results": results,
            "summary": {
                "total_questions": len(answers),
                "correct_answers": total_correct,
                "accuracy": round((total_correct / len(answers)) * 100),
                "points_earned": total_points,
                "level_up": level_up,
                "new_level": progress.level if level_up else None,
                "unlocked_responses": progress.unlocked_responses,
                "question_types": list(set(answer["answer_type"] for answer in answers))
            },
            "updated_stats": get_user_stats(user_id)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhanced quiz submission error: {str(e)}")
    

# Enhanced skip batch quiz endpoint
@app.post("/api/v1/quiz/skip-batch")
async def skip_batch_quiz(user_id: str = "default"):
    """Skip entire batch quiz - give minimal responses"""
    progress = get_user_progress(user_id)
    progress.unlocked_responses = 1  # Minimal response for skipping
    progress.streak = max(0, progress.streak - 1)  # Small penalty for skipping
    
    stats = get_user_stats(user_id)
    
    return {
        "result": {
            "correct": False,
            "explanation": "Quiz batch skipped - you get 1 limited response.",
            "unlocked_responses": 1,
            "level_up": False
        },
        "updated_stats": stats
    }

# Enhanced question selection with learning analytics
def get_personalized_questions(user_id: str, count: int = 3) -> List[QuizQuestion]:
    """Get personalized questions based on user's learning pattern"""
    progress = get_user_progress(user_id)
    
    # TODO: In a real system, you'd track which topics user struggles with
    # For now, we'll use level-based selection
    
    if progress.level <= 2:
        # Focus on basics
        topics = ["JavaScript", "Python"]
        difficulties = ["easy", "medium"]
    elif progress.level <= 5:
        # Broader topics, mixed difficulty
        topics = ["JavaScript", "Python", "TypeScript", "React"]
        difficulties = ["easy", "medium", "hard"]
    else:
        # All topics, focus on advanced
        topics = ["JavaScript", "Python", "TypeScript", "React", "Algorithms"]
        difficulties = ["medium", "hard"]
    
    # Filter questions
    filtered_questions = [
        q for q in QUESTION_BANK 
        if q.topic in topics and q.difficulty in difficulties
    ]
    
    if len(filtered_questions) < count:
        # Fallback to all questions if not enough filtered
        filtered_questions = QUESTION_BANK
    
    return random.sample(filtered_questions, min(count, len(filtered_questions)))

# Update the get_quiz_questions to use personalized selection
@app.get("/api/v1/quiz/questions-personalized")
async def get_personalized_quiz_questions(count: int = 3, user_id: str = "default"):
    """Get personalized quiz questions based on user's learning progress"""
    questions = get_personalized_questions(user_id, count)
    return {"questions": questions}

# Analytics endpoint for tracking learning patterns
@app.get("/api/v1/analytics/user/{user_id}")
async def get_user_analytics(user_id: str):
    """Get detailed analytics for user learning patterns"""
    progress = get_user_progress(user_id)
    
    # Calculate accuracy by difficulty (would need tracking in real system)
    total_accuracy = (progress.correct_answers / progress.total_questions * 100) if progress.total_questions > 0 else 0
    
    return {
        "user_id": user_id,
        "level": progress.level,
        "total_questions": progress.total_questions,
        "correct_answers": progress.correct_answers,
        "overall_accuracy": round(total_accuracy),
        "current_streak": progress.streak,
        "unlocked_responses": progress.unlocked_responses,
        "last_quiz": progress.last_quiz_time,
        "performance_trend": "improving" if progress.streak > 0 else "needs_work",
        "recommended_topics": ["JavaScript", "Algorithms"] if total_accuracy < 70 else ["Advanced Concepts"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)