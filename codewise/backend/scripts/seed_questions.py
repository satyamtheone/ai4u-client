#!/usr/bin/env python3
"""
Script to seed initial quiz questions
"""
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import SessionLocal
from services.question_bank_service import QuestionBankService
import structlog

logger = structlog.get_logger(__name__)

def main():
    """Seed the database with initial questions"""
    try:
        db = SessionLocal()
        question_service = QuestionBankService(db)
        
        logger.info("Starting question bank seeding...")
        count = question_service.seed_initial_questions()
        
        stats = question_service.get_question_bank_stats()
        logger.info("Question bank seeding completed", 
                   questions_created=count,
                   total_questions=stats["total_questions"],
                   topics=stats["available_topics"])
        
        db.close()
        
    except Exception as e:
        logger.error("Question seeding failed", error=str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
