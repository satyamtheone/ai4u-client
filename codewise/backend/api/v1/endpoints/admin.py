from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import uuid

from core.database import get_db
from schemas.common import ResponseModel
from services.learning_service import LearningService
from services.question_bank_service import QuestionBankService
from api.dependencies import get_current_user
from models.user import User
from models.learning import UserProgress, QuizSubmission
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.get("/learning/stats", response_model=ResponseModel[Dict[str, Any]])
async def get_admin_learning_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system-wide learning statistics (Super Admin only)"""
    try:
        # TODO: Add super admin permission check
        
        # Get organization context for filtering
        organization_id = None
        if current_user.account_types:
            org_account = next(
                (at for at in current_user.account_types 
                 if at.account_type.value == "organization_member"), 
                None
            )
            if org_account:
                organization_id = org_account.organization_id
        
        # Basic stats queries
        total_users_query = db.query(UserProgress)
        total_submissions_query = db.query(QuizSubmission)
        
        # Filter by organization if applicable
        if organization_id:
            total_users_query = total_users_query.filter(
                UserProgress.organization_id == organization_id
            )
            total_submissions_query = total_submissions_query.filter(
                QuizSubmission.organization_id == organization_id
            )
        
        total_users = total_users_query.count()
        total_submissions = total_submissions_query.count()
        total_correct = total_submissions_query.filter(
            QuizSubmission.is_correct == True
        ).count()
        
        # Get question bank stats
        question_service = QuestionBankService(db)
        question_stats = question_service.get_question_bank_stats()
        
        # Calculate overall accuracy
        overall_accuracy = (
            (total_correct / total_submissions * 100) 
            if total_submissions > 0 else 0
        )
        
        # Get user level distribution
        level_distribution = {}
        for level in range(1, 11):  # Levels 1-10
            count = total_users_query.filter(UserProgress.level == level).count()
            if count > 0:
                level_distribution[f"level_{level}"] = count
        
        stats = {
            "total_learning_users": total_users,
            "total_quiz_submissions": total_submissions,
            "total_correct_answers": total_correct,
            "overall_accuracy": round(overall_accuracy, 1),
            "question_bank": question_stats,
            "user_level_distribution": level_distribution,
            "organization_scope": "organization" if organization_id else "system"
        }
        
        logger.info("Admin learning stats retrieved", 
                   admin_id=str(current_user.id),
                   scope="organization" if organization_id else "system")
        
        return ResponseModel(
            success=True,
            message="Learning statistics retrieved successfully",
            data=stats
        )
        
    except Exception as e:
        logger.error("Failed to get admin learning stats", 
                    admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve learning statistics"
        )

@router.post("/learning/seed-questions", response_model=ResponseModel[Dict[str, Any]])
async def seed_question_bank(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seed the question bank with initial questions (Admin only)"""
    try:
        # TODO: Add admin permission check
        
        question_service = QuestionBankService(db)
        count = question_service.seed_initial_questions()
        stats = question_service.get_question_bank_stats()
        
        logger.info("Question bank seeded", 
                   admin_id=str(current_user.id),
                   questions_created=count)
        
        return ResponseModel(
            success=True,
            message=f"Question bank seeded with {count} questions",
            data={
                "questions_created": count,
                "question_bank_stats": stats
            }
        )
        
    except Exception as e:
        logger.error("Failed to seed question bank", 
                    admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to seed question bank"
        )

@router.get("/learning/user-analytics/{user_id}", response_model=ResponseModel[Dict[str, Any]])
async def get_user_learning_analytics(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed learning analytics for a specific user (Admin only)"""
    try:
        # TODO: Add admin permission check
        
        learning_service = LearningService(db)
        
        # Get user progress
        progress = learning_service.get_user_progress(user_id)
        stats = learning_service.get_user_stats(user_id)
        
        # Get recent submissions
        recent_submissions = db.query(QuizSubmission).filter(
            QuizSubmission.user_id == user_id
        ).order_by(QuizSubmission.submitted_at.desc()).limit(10).all()
        
        # Calculate performance trends
        accuracy_trend = "improving" if progress.streak > 0 else "needs_work"
        
        analytics = {
            "user_id": str(user_id),
            "progress": {
                "level": progress.level,
                "total_questions": progress.total_questions,
                "correct_answers": progress.correct_answers,
                "current_streak": progress.streak,
                "unlocked_responses": progress.unlocked_responses
            },
            "performance": stats,
            "trends": {
                "accuracy_trend": accuracy_trend,
                "recent_activity": len(recent_submissions),
                "last_quiz": progress.last_quiz_time.isoformat() if progress.last_quiz_time else None
            },
            "recent_submissions": [
                {
                    "question_id": str(sub.question_id),
                    "is_correct": sub.is_correct,
                    "points_earned": sub.points_earned,
                    "submitted_at": sub.submitted_at.isoformat()
                }
                for sub in recent_submissions
            ]
        }
        
        logger.info("User learning analytics retrieved", 
                   admin_id=str(current_user.id),
                   target_user_id=str(user_id))
        
        return ResponseModel(
            success=True,
            message="User learning analytics retrieved successfully",
            data=analytics
        )
        
    except Exception as e:
        logger.error("Failed to get user learning analytics", 
                    admin_id=str(current_user.id),
                    target_user_id=str(user_id), 
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user learning analytics"
        )