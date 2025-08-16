from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid

from core.database import get_db
from schemas.learning import (
    ChatRequest, ChatResponse, QuizQuestionCreate, QuizQuestionResponse,
    QuizQuestionSafe, QuizSubmissionRequest, BatchQuizSubmission,
    BatchQuizResult, UserStats, UserProgressResponse
)
from schemas.common import ResponseModel, PaginatedResponse, PaginationParams
from services.learning_service import LearningService
from services.chat_service import ChatService
from api.dependencies import get_current_user, get_optional_current_user
from models.user import User
from models.learning import QuizQuestion
from utils.request_utils import get_client_ip, get_user_agent
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.post("/chat", response_model=ResponseModel[ChatResponse])
async def chat_with_ai(
    request: ChatRequest,
    req: Request,
    learning_gates: bool = Query(False, description="Enable learning gates"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enhanced chat endpoint with learning gates integration"""
    try:
        chat_service = ChatService(db)
        
        # Override learning gates setting if provided in query
        if learning_gates:
            request.enable_learning_gates = True
        
        # Get organization context (if user is part of organization)
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        response = await chat_service.process_chat_request(
            request=request,
            user_id=current_user.id,
            organization_id=organization_id,
            ip_address=get_client_ip(req),
            user_agent=get_user_agent(req)
        )
        
        logger.info("Chat processed", 
                   user_id=str(current_user.id),
                   type=response.type,
                   learning_gates=request.enable_learning_gates)
        
        return ResponseModel(
            success=True,
            message="Chat processed successfully",
            data=response
        )
        
    except Exception as e:
        logger.error("Chat processing failed", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )

@router.post("/quiz/submit", response_model=ResponseModel[Dict[str, Any]])
async def submit_quiz_answer(
    submission: QuizSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a single quiz answer"""
    try:
        learning_service = LearningService(db)
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        result = learning_service.submit_quiz_answer(
            user_id=current_user.id,
            question_id=submission.question_id,
            submission=submission,
            organization_id=organization_id
        )
        
        # Get updated stats
        stats = learning_service.get_user_stats(current_user.id, organization_id)
        
        logger.info("Quiz answer submitted", 
                   user_id=str(current_user.id),
                   question_id=str(submission.question_id),
                   correct=result["correct"])
        
        return ResponseModel(
            success=True,
            message="Quiz answer submitted successfully",
            data={
                "result": result,
                "updated_stats": stats
            }
        )
        
    except Exception as e:
        logger.error("Quiz submission failed", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit quiz answer"
        )

@router.post("/quiz/submit-batch", response_model=ResponseModel[BatchQuizResult])
async def submit_batch_quiz(
    submission: BatchQuizSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit multiple quiz answers in batch"""
    try:
        learning_service = LearningService(db)
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        results = []
        total_correct = 0
        total_points = 0
        
        for answer in submission.answers:
            try:
                result = learning_service.submit_quiz_answer(
                    user_id=current_user.id,
                    question_id=answer.question_id,
                    submission=answer,
                    organization_id=organization_id
                )
                
                if result["correct"]:
                    total_correct += 1
                    total_points += result.get("points_earned", 1)
                
                # Get question for response
                question = db.query(QuizQuestion).filter(
                    QuizQuestion.id == answer.question_id
                ).first()
                
                results.append({
                    "question_id": answer.question_id,
                    "correct": result["correct"],
                    "selected_answer": answer.selected_answer,
                    "correct_answer": question.correct_answer if question else None,
                    "answer_type": answer.answer_type,
                    "explanation": question.explanation if question else None,
                    "points_earned": result.get("points_earned", 0)
                })
                
            except Exception as e:
                logger.error("Failed to process single answer", 
                           question_id=str(answer.question_id), error=str(e))
                # Continue with other answers
                continue
        
        # Get updated stats
        stats = learning_service.get_user_stats(current_user.id, organization_id)
        
        summary = {
            "total_questions": len(submission.answers),
            "correct_answers": total_correct,
            "accuracy": round((total_correct / len(submission.answers)) * 100, 1),
            "points_earned": total_points,
            "question_types": list(set(answer.answer_type for answer in submission.answers))
        }
        
        batch_result = BatchQuizResult(
            results=results,
            summary=summary,
            updated_stats=stats
        )
        
        logger.info("Batch quiz submitted", 
                   user_id=str(current_user.id),
                   total_questions=len(submission.answers),
                   correct=total_correct)
        
        return ResponseModel(
            success=True,
            message="Batch quiz submitted successfully",
            data=batch_result
        )
        
    except Exception as e:
        logger.error("Batch quiz submission failed", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit batch quiz"
        )

@router.post("/quiz/skip", response_model=ResponseModel[Dict[str, Any]])
async def skip_quiz(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Skip current quiz and get limited responses"""
    try:
        learning_service = LearningService(db)
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        progress = learning_service.get_user_progress(current_user.id, organization_id)
        progress.unlocked_responses = 1  # Give minimal responses for skipping
        progress.streak = max(0, progress.streak - 1)  # Small penalty
        db.commit()
        
        stats = learning_service.get_user_stats(current_user.id, organization_id)
        
        logger.info("Quiz skipped", user_id=str(current_user.id))
        
        return ResponseModel(
            success=True,
            message="Quiz skipped - limited responses granted",
            data={
                "result": {
                    "correct": False,
                    "explanation": "Quiz skipped - you get 1 limited response.",
                    "unlocked_responses": 1,
                    "level_up": False
                },
                "updated_stats": stats
            }
        )
        
    except Exception as e:
        logger.error("Quiz skip failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to skip quiz"
        )

@router.get("/questions", response_model=ResponseModel[List[QuizQuestionSafe]])
async def get_quiz_questions(
    count: int = Query(3, ge=1, le=10, description="Number of questions to return"),
    difficulty: str = Query("mixed", regex="^(easy|medium|hard|mixed)$"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized quiz questions"""
    try:
        learning_service = LearningService(db)
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        questions = []
        topics = [topic] if topic else None
        
        # Get multiple questions
        for _ in range(count):
            question = learning_service.get_quiz_question(
                user_id=current_user.id,
                organization_id=organization_id,
                difficulty=difficulty,
                topics=topics
            )
            if question and question not in questions:
                questions.append(question)
        
        # Convert to safe format (without answers)
        safe_questions = [QuizQuestionSafe.from_orm(q) for q in questions]
        
        logger.info("Quiz questions retrieved", 
                   user_id=str(current_user.id),
                   count=len(safe_questions))
        
        return ResponseModel(
            success=True,
            message="Quiz questions retrieved successfully",
            data=safe_questions
        )
        
    except Exception as e:
        logger.error("Failed to get quiz questions", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quiz questions"
        )

@router.get("/stats", response_model=ResponseModel[UserStats])
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's learning statistics"""
    try:
        learning_service = LearningService(db)
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        stats = learning_service.get_user_stats(current_user.id, organization_id)
        
        return ResponseModel(
            success=True,
            message="User statistics retrieved successfully",
            data=UserStats(**stats)
        )
        
    except Exception as e:
        logger.error("Failed to get user stats", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user statistics"
        )

@router.get("/progress", response_model=ResponseModel[UserProgressResponse])
async def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed user learning progress"""
    try:
        learning_service = LearningService(db)
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        progress = learning_service.get_user_progress(current_user.id, organization_id)
        
        return ResponseModel(
            success=True,
            message="User progress retrieved successfully",
            data=UserProgressResponse.from_orm(progress)
        )
        
    except Exception as e:
        logger.error("Failed to get user progress", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user progress"
        )

@router.post("/progress/reset", response_model=ResponseModel[str])
async def reset_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user's learning progress"""
    try:
        learning_service = LearningService(db)
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        # Reset progress by deleting and recreating
        progress = learning_service.get_user_progress(current_user.id, organization_id)
        progress.total_questions = 0
        progress.correct_answers = 0
        progress.streak = 0
        progress.unlocked_responses = 0
        progress.level = 1
        progress.message_count = 0
        
        db.commit()
        
        logger.info("User progress reset", user_id=str(current_user.id))
        
        return ResponseModel(
            success=True,
            message="Progress reset successfully",
            data="Progress has been reset to initial state"
        )
        
    except Exception as e:
        logger.error("Failed to reset progress", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset progress"
        )

# Admin endpoints for question management
@router.post("/admin/questions", response_model=ResponseModel[QuizQuestionResponse])
async def create_quiz_question(
    question_data: QuizQuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new quiz question (Admin only)"""
    try:
        # TODO: Add admin permission check here
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        question = QuizQuestion(
            question=question_data.question,
            question_type=question_data.question_type,
            options=question_data.options,
            correct_answer=question_data.correct_answer,
            correct_answers=question_data.correct_answers,
            keywords=question_data.keywords,
            max_length=question_data.max_length,
            explanation=question_data.explanation,
            difficulty=question_data.difficulty,
            topic=question_data.topic,
            created_by=current_user.id,
            organization_id=organization_id
        )
        
        db.add(question)
        db.commit()
        db.refresh(question)
        
        logger.info("Quiz question created", 
                   question_id=str(question.id),
                   created_by=str(current_user.id))
        
        return ResponseModel(
            success=True,
            message="Quiz question created successfully",
            data=QuizQuestionResponse.from_orm(question)
        )
        
    except Exception as e:
        db.rollback()
        logger.error("Failed to create quiz question", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create quiz question"
        )

@router.get("/admin/questions", response_model=ResponseModel[PaginatedResponse[QuizQuestionResponse]])
async def list_quiz_questions(
    pagination: PaginationParams = Depends(),
    difficulty: Optional[str] = Query(None, regex="^(easy|medium|hard)$"),
    topic: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List quiz questions (Admin only)"""
    try:
        # TODO: Add admin permission check here
        
        # Get organization context
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        query = db.query(QuizQuestion).filter(
            QuizQuestion.is_active == True
        )
        
        # Filter by organization
        if organization_id:
            query = query.filter(
                (QuizQuestion.organization_id == organization_id) |
                (QuizQuestion.organization_id.is_(None))
            )
        else:
            query = query.filter(QuizQuestion.organization_id.is_(None))
        
        # Apply filters
        if difficulty:
            query = query.filter(QuizQuestion.difficulty == difficulty)
        if topic:
            query = query.filter(QuizQuestion.topic == topic)
        
        total = query.count()
        questions = query.offset(
            (pagination.page - 1) * pagination.page_size
        ).limit(pagination.page_size).all()
        
        return ResponseModel(
            success=True,
            message="Quiz questions retrieved successfully",
            data=PaginatedResponse(
                items=[QuizQuestionResponse.from_orm(q) for q in questions],
                total=total,
                page=pagination.page,
                page_size=pagination.page_size,
                total_pages=(total + pagination.page_size - 1) // pagination.page_size
            )
        )
        
    except Exception as e:
        logger.error("Failed to list quiz questions", 
                    user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quiz questions"
        )
