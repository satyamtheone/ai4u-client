from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import Optional, List, Dict, Any, Union
import uuid
import random
import structlog
from datetime import timedelta, datetime


from models.learning import (
    QuizQuestion, UserProgress, QuizSubmission, 
    ChatSession, ChatMessage, DifficultyEnum, QuestionTypeEnum
)
from models.activity_log import ActivityActionEnum
from models.user import User
from schemas.learning import QuizQuestionCreate, QuizSubmissionRequest
from services.activity_service import ActivityService

logger = structlog.get_logger(__name__)

class LearningService:
    """Service for learning gates and quiz management"""
    
    def __init__(self, db: Session):
        self.db = db
        self.activity_service = ActivityService(db)
    
    def get_user_progress(
        self, 
        user_id: uuid.UUID,
        organization_id: Optional[uuid.UUID] = None
    ) -> UserProgress:
        """Get or create user progress"""
        try:
            progress = self.db.query(UserProgress).filter(
                and_(
                    UserProgress.user_id == user_id,
                    UserProgress.organization_id == organization_id
                )
            ).first()
            
            if not progress:
                progress = UserProgress(
                    user_id=user_id,
                    organization_id=organization_id
                )
                self.db.add(progress)
                self.db.commit()
                
                logger.info("Created new user progress", user_id=str(user_id))
            
            return progress
            
        except Exception as e:
            logger.error("Failed to get user progress", user_id=str(user_id), error=str(e))
            self.db.rollback()
            raise
    
    def should_show_gate(
        self, 
        user_id: uuid.UUID,
        organization_id: Optional[uuid.UUID] = None,
        gate_frequency: int = 2
    ) -> bool:
        """Determine if learning gate should be shown"""
        try:
            progress = self.get_user_progress(user_id, organization_id)
            
            # Check if user has unlocked responses remaining
            if progress.unlocked_responses > 0:
                progress.unlocked_responses -= 1
                self.db.commit()
                return False
            
            # Show gate based on frequency
            progress.message_count += 1
            should_show = progress.message_count % gate_frequency == 0
            self.db.commit()
            
            return should_show
            
        except Exception as e:
            logger.error("Failed to check gate status", user_id=str(user_id), error=str(e))
            return False
    
    def get_quiz_question(
        self,
        user_id: uuid.UUID,
        organization_id: Optional[uuid.UUID] = None,
        difficulty: str = "mixed",
        topics: Optional[List[str]] = None
    ) -> Optional[QuizQuestion]:
        """Get personalized quiz question"""
        try:
            progress = self.get_user_progress(user_id, organization_id)
            
            # Build query for available questions
            query = self.db.query(QuizQuestion).filter(
                QuizQuestion.is_active == True
            )
            
            # Filter by organization or global questions
            if organization_id:
                query = query.filter(
                    (QuizQuestion.organization_id == organization_id) |
                    (QuizQuestion.organization_id.is_(None))
                )
            else:
                query = query.filter(QuizQuestion.organization_id.is_(None))
            
            # Personalize based on user level
            if difficulty == "mixed":
                if progress.level <= 2:
                    difficulty_weights = {"easy": 0.7, "medium": 0.3, "hard": 0.0}
                elif progress.level <= 5:
                    difficulty_weights = {"easy": 0.3, "medium": 0.5, "hard": 0.2}
                else:
                    difficulty_weights = {"easy": 0.1, "medium": 0.4, "hard": 0.5}
                
                # Weighted random selection
                difficulties = list(difficulty_weights.keys())
                weights = list(difficulty_weights.values())
                selected_difficulty = random.choices(difficulties, weights=weights)[0]
                query = query.filter(QuizQuestion.difficulty == DifficultyEnum(selected_difficulty))
            else:
                query = query.filter(QuizQuestion.difficulty == difficulty)
            
            # Filter by topics if specified
            if topics:
                query = query.filter(QuizQuestion.topic.in_(topics))
            
            # Get questions not recently answered
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_submissions = self.db.query(QuizSubmission.question_id).filter(
                and_(
                    QuizSubmission.user_id == user_id,
                    QuizSubmission.submitted_at >= yesterday
                )
            ).subquery()
            
            query = query.filter(~QuizQuestion.id.in_(recent_submissions))
            questions = query.all()
            
            if not questions:
                # Fallback to any available question
                questions = self.db.query(QuizQuestion).filter(
                    QuizQuestion.is_active == True
                ).all()
            
            return random.choice(questions) if questions else None
            
        except Exception as e:
            logger.error("Failed to get quiz question", user_id=str(user_id), error=str(e))
            return None
    
    def submit_quiz_answer(
        self,
        user_id: uuid.UUID,
        question_id: uuid.UUID,
        submission: QuizSubmissionRequest,
        organization_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """Process quiz answer and update progress"""
        try:
            question = self.db.query(QuizQuestion).filter(
                QuizQuestion.id == question_id
            ).first()
            
            if not question:
                raise ValueError("Question not found")
            
            # Evaluate answer
            is_correct = self._evaluate_answer(question, submission)
            
            # Calculate points
            points = self._calculate_points(question, is_correct)
            
            # Create submission record
            quiz_submission = QuizSubmission(
                user_id=user_id,
                question_id=question_id,
                organization_id=organization_id,
                selected_answer=submission.selected_answer,
                is_correct=is_correct,
                points_earned=points,
                time_taken=submission.time_taken
            )
            self.db.add(quiz_submission)
            
            # Update user progress
            progress = self.get_user_progress(user_id, organization_id)
            progress.total_questions += 1
            
            if is_correct:
                progress.correct_answers += 1
                progress.streak += 1
                
                # Calculate unlocked responses based on streak and points
                bonus_responses = progress.streak // 3
                progress.unlocked_responses = max(3, points) + bonus_responses
            else:
                progress.streak = 0
                progress.unlocked_responses = 1
            
            # Check for level up
            old_level = progress.level
            progress.level = (progress.correct_answers // 10) + 1
            level_up = progress.level > old_level
            
            self.db.commit()
            # Log activity
            self.activity_service.log_activity(
                user_id=user_id,
                organization_id=organization_id,
                action=ActivityActionEnum("quiz_submitted"),
                resource_type="quiz_question",
                resource_id=question_id,
                metadata={
                    "correct": is_correct,
                    "points": points,
                    "difficulty": question.difficulty.value,
                    "topic": question.topic
                }
            )
            
            logger.info("Quiz answer submitted", 
                       user_id=str(user_id), 
                       question_id=str(question_id), 
                       correct=is_correct,
                       points=points)
            
            return {
                "correct": is_correct,
                "explanation": question.explanation,
                "points_earned": points,
                "unlocked_responses": progress.unlocked_responses,
                "level_up": level_up,
                "new_level": progress.level if level_up else None,
                "streak": progress.streak
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to submit quiz answer", 
                        user_id=str(user_id), 
                        question_id=str(question_id), 
                        error=str(e))
            raise
    
    def _evaluate_answer(
        self, 
        question: QuizQuestion, 
        submission: QuizSubmissionRequest
    ) -> bool:
        """Evaluate if the submitted answer is correct"""
        if question.question_type == QuestionTypeEnum.SINGLE_CHOICE:
            return submission.selected_answer == question.correct_answer
        
        elif question.question_type == QuestionTypeEnum.MULTIPLE_CHOICE:
            if not isinstance(submission.selected_answer, list):
                return False
            correct_set = set(question.correct_answers or [])
            selected_set = set(submission.selected_answer)
            return correct_set == selected_set and len(selected_set) > 0
        
        elif question.question_type == QuestionTypeEnum.SHORT_ANSWER:
            answer_text = str(submission.selected_answer).lower().strip()
            keywords = question.keywords or []
            return any(keyword.lower() in answer_text for keyword in keywords)
        
        return False
    
    def _calculate_points(self, question: QuizQuestion, is_correct: bool) -> int:
        """Calculate points earned for a question"""
        if not is_correct:
            return 0
        
        base_points = {
            QuestionTypeEnum.SINGLE_CHOICE: 1,
            QuestionTypeEnum.MULTIPLE_CHOICE: 2,
            QuestionTypeEnum.SHORT_ANSWER: 3
        }.get(question.question_type, 1)
        
        difficulty_multiplier = {
            DifficultyEnum.EASY: 1,
            DifficultyEnum.MEDIUM: 1.5,
            DifficultyEnum.HARD: 2
        }.get(question.difficulty, 1)
        
        return int(base_points * difficulty_multiplier)
    
    def get_user_stats(
        self, 
        user_id: uuid.UUID,
        organization_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """Get user learning statistics"""
        try:
            progress = self.get_user_progress(user_id, organization_id)
            accuracy = (
                progress.correct_answers / progress.total_questions * 100 
                if progress.total_questions > 0 else 0
            )
            
            return {
                "level": progress.level,
                "current_streak": progress.streak,
                "accuracy": round(accuracy, 1),
                "total_questions": progress.total_questions,
                "unlocked_responses": progress.unlocked_responses,
                "correct_answers": progress.correct_answers
            }
            
        except Exception as e:
            logger.error("Failed to get user stats", user_id=str(user_id), error=str(e))
            return {
                "level": 1,
                "current_streak": 0,
                "accuracy": 0,
                "total_questions": 0,
                "unlocked_responses": 0,
                "correct_answers": 0
            }