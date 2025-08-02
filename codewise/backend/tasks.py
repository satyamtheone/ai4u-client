# tasks.py
from celery import Celery
import asyncio
from sqlalchemy.orm import sessionmaker
from database import engine

celery_app = Celery(
    'codewise',
    broker='redis://localhost:6379',
    backend='redis://localhost:6379'
)

Session = sessionmaker(bind=engine)

@celery_app.task
def process_code_generation(user_id: str, prompt: str, language: str):
    """Background task for heavy code analysis"""
    # This runs in background, doesn't block the API response
    session = Session()
    
    try:
        # Heavy processing
        code = generate_code_sync(prompt, language)
        analysis = analyze_code_deeply(code, language)
        questions = generate_advanced_questions(code, analysis)
        
        # Save to database
        session.add(CodingSession(
            user_id=user_id,
            prompt=prompt,
            generated_code=code,
            language=language,
            complexity_score=analysis['complexity']['cyclomatic'],
            concepts=analysis['concepts']
        ))
        session.commit()
        
        # Notify user via WebSocket when ready
        notify_user_code_ready(user_id, {
            'code': code,
            'questions': questions,
            'analysis': analysis
        })
        
    finally:
        session.close()

@celery_app.task
def update_learning_analytics(user_id: str, quiz_result: dict):
    """Update user learning progress analytics"""
    session = Session()
    
    try:
        # Update concept proficiency
        for concept in quiz_result['concepts']:
            progress = session.query(LearningProgress).filter_by(
                user_id=user_id,
                concept=concept
            ).first()
            
            if not progress:
                progress = LearningProgress(user_id=user_id, concept=concept)
                session.add(progress)
            
            progress.total_attempts += 1
            if quiz_result['passed']:
                progress.successful_attempts += 1
            
            # Calculate proficiency (0-100)
            progress.proficiency_level = min(100, 
                (progress.successful_attempts / progress.total_attempts) * 100
            )
            
        session.commit()
        
    finally:
        session.close()