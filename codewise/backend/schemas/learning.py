from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid

class QuizQuestionBase(BaseModel):
    question: str = Field(..., min_length=10, max_length=1000)
    question_type: str = Field(..., pattern="^(single_choice|multiple_choice|short_answer)$")
    topic: str = Field(..., min_length=1, max_length=100)
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")

class QuizQuestionCreate(QuizQuestionBase):
    options: Optional[List[str]] = None
    correct_answer: Optional[int] = None
    correct_answers: Optional[List[int]] = None
    keywords: Optional[List[str]] = None
    max_length: Optional[int] = None
    explanation: Optional[str] = None

    @validator('options')
    def validate_options(cls, v, values):
        if values.get('question_type') in ['single_choice', 'multiple_choice'] and not v:
            raise ValueError('Options required for choice questions')
        return v

class QuizQuestionResponse(QuizQuestionBase):
    id: uuid.UUID
    options: Optional[List[str]]
    explanation: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class QuizQuestionSafe(BaseModel):
    """Safe version without correct answers for frontend"""
    id: uuid.UUID
    question: str
    question_type: str
    options: Optional[List[str]]
    max_length: Optional[int]
    difficulty: str
    topic: str

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    session_id: Optional[uuid.UUID] = None
    enable_learning_gates: Optional[bool] = None
    gate_frequency: Optional[int] = Field(None, ge=1, le=10)

class ChatResponse(BaseModel):
    type: str = "chat_response"  # "chat_response" or "learning_gate"
    response: Optional[str] = None
    session_id: uuid.UUID
    message_id: Optional[uuid.UUID] = None
    timestamp: datetime
    question: Optional[QuizQuestionSafe] = None
    stats: Optional[Dict] = None
    message: Optional[str] = None
    
class QuizSubmissionRequest(BaseModel):
    question_id: uuid.UUID
    selected_answer: Union[int, List[int], str]
    answer_type: str = Field(..., pattern="^(single_choice|multiple_choice|short_answer)$")
    time_taken: Optional[int] = None

class BatchQuizSubmission(BaseModel):
    answers: List[QuizSubmissionRequest]

class QuizResult(BaseModel):
    question_id: uuid.UUID
    correct: bool
    selected_answer: Union[int, List[int], str]
    correct_answer: Optional[Union[int, List[int]]]
    answer_type: str
    explanation: Optional[str]
    points_earned: int

class BatchQuizResult(BaseModel):
    results: List[QuizResult]
    summary: Dict[str, Any]
    updated_stats: Dict[str, Any]

class UserStats(BaseModel):
    level: int
    current_streak: int
    accuracy: float
    total_questions: int
    unlocked_responses: int

class UserProgressResponse(BaseModel):
    user_id: uuid.UUID
    total_questions: int
    correct_answers: int
    streak: int
    unlocked_responses: int
    level: int
    message_count: int
    last_quiz_time: datetime

    class Config:
        from_attributes = True