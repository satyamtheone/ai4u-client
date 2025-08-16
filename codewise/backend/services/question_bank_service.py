from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import structlog

from models.learning import QuizQuestion, DifficultyEnum, QuestionTypeEnum
from schemas.learning import QuizQuestionCreate

logger = structlog.get_logger(__name__)

class QuestionBankService:
    """Service for managing the question bank and seeding initial data"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def seed_initial_questions(self) -> int:
        """Seed the database with initial quiz questions from your POC"""
        try:
            # Check if questions already exist
            existing_count = self.db.query(QuizQuestion).count()
            if existing_count > 0:
                logger.info("Questions already exist, skipping seed", count=existing_count)
                return existing_count
            
            initial_questions = [
                {
                    "question": "What does the 'const' keyword do in JavaScript?",
                    "question_type": QuestionTypeEnum.SINGLE_CHOICE,
                    "options": [
                        "Creates a variable that can be reassigned",
                        "Creates a constant that cannot be reassigned", 
                        "Creates a global variable",
                        "Creates a function"
                    ],
                    "correct_answer": 1,
                    "explanation": "The 'const' keyword creates a constant that cannot be reassigned after declaration.",
                    "difficulty": DifficultyEnum.EASY,
                    "topic": "JavaScript"
                },
                {
                    "question": "Which method adds an element to the end of an array?",
                    "question_type": QuestionTypeEnum.SINGLE_CHOICE,
                    "options": ["push()", "pop()", "shift()", "unshift()"],
                    "correct_answer": 0,
                    "explanation": "The push() method adds one or more elements to the end of an array.",
                    "difficulty": DifficultyEnum.EASY,
                    "topic": "JavaScript"
                },
                {
                    "question": "How do you create a list in Python?",
                    "question_type": QuestionTypeEnum.MULTIPLE_CHOICE,
                    "options": ["list = {}", "list = []", "list = ()", "list = \"\""],
                    "correct_answers": [1],  # Only [] is correct for lists
                    "explanation": "Square brackets [] are used to create lists in Python.",
                    "difficulty": DifficultyEnum.EASY,
                    "topic": "Python"
                },
                {
                    "question": "What is TypeScript?",
                    "question_type": QuestionTypeEnum.SHORT_ANSWER,
                    "max_length": 200,
                    "keywords": ["superset", "javascript", "typing", "static"],
                    "explanation": "TypeScript is a superset of JavaScript that adds static typing.",
                    "difficulty": DifficultyEnum.MEDIUM,
                    "topic": "TypeScript"
                },
                {
                    "question": "How do you define a function with optional parameters in TypeScript?",
                    "question_type": QuestionTypeEnum.SINGLE_CHOICE,
                    "options": [
                        "function myFunc(param: string?) {}",
                        "function myFunc(param?: string) {}",
                        "function myFunc(param: optional string) {}",
                        "function myFunc([param]: string) {}"
                    ],
                    "correct_answer": 1,
                    "explanation": "In TypeScript, optional parameters are defined using the '?' symbol after the parameter name.",
                    "difficulty": DifficultyEnum.MEDIUM,
                    "topic": "TypeScript"
                },
                {
                    "question": "What is JSX in React?",
                    "question_type": QuestionTypeEnum.SINGLE_CHOICE,
                    "options": [
                        "A database query language",
                        "A syntax extension for JavaScript",
                        "A CSS framework",
                        "A testing library"
                    ],
                    "correct_answer": 1,
                    "explanation": "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript.",
                    "difficulty": DifficultyEnum.MEDIUM,
                    "topic": "React"
                },
                {
                    "question": "What is the time complexity of binary search?",
                    "question_type": QuestionTypeEnum.SINGLE_CHOICE,
                    "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
                    "correct_answer": 1,
                    "explanation": "Binary search has O(log n) time complexity because it halves the search space in each iteration.",
                    "difficulty": DifficultyEnum.HARD,
                    "topic": "Algorithms"
                },
                {
                    "question": "Which sorting algorithm has the best average-case time complexity?",
                    "question_type": QuestionTypeEnum.SINGLE_CHOICE,
                    "options": ["Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"],
                    "correct_answer": 2,
                    "explanation": "Merge Sort has O(n log n) time complexity in all cases, making it consistently efficient.",
                    "difficulty": DifficultyEnum.HARD,
                    "topic": "Algorithms"
                },
                {
                    "question": "What are Python list comprehensions used for?",
                    "question_type": QuestionTypeEnum.SHORT_ANSWER,
                    "max_length": 150,
                    "keywords": ["concise", "create", "lists", "iteration", "filtering"],
                    "explanation": "List comprehensions provide a concise way to create lists by iterating over iterables and optionally filtering elements.",
                    "difficulty": DifficultyEnum.MEDIUM,
                    "topic": "Python"
                },
                {
                    "question": "Which of the following are valid JavaScript data types?",
                    "question_type": QuestionTypeEnum.MULTIPLE_CHOICE,
                    "options": ["string", "number", "boolean", "undefined", "symbol"],
                    "correct_answers": [0, 1, 2, 3, 4],  # All are correct
                    "explanation": "All listed options are valid JavaScript data types.",
                    "difficulty": DifficultyEnum.EASY,
                    "topic": "JavaScript"
                }
            ]
            
            created_count = 0
            for q_data in initial_questions:
                question = QuizQuestion(
                    question=q_data["question"],
                    question_type=q_data["question_type"],
                    options=q_data.get("options"),
                    correct_answer=q_data.get("correct_answer"),
                    correct_answers=q_data.get("correct_answers"),
                    keywords=q_data.get("keywords"),
                    max_length=q_data.get("max_length"),
                    explanation=q_data["explanation"],
                    difficulty=q_data["difficulty"],
                    topic=q_data["topic"],
                    organization_id=None  # Global questions
                )
                self.db.add(question)
                created_count += 1
            
            self.db.commit()
            logger.info("Initial questions seeded successfully", count=created_count)
            return created_count
            
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to seed initial questions", error=str(e))
            raise
    
    def get_question_bank_stats(self) -> Dict[str, Any]:
        """Get statistics about the question bank"""
        try:
            total_questions = self.db.query(QuizQuestion).filter(
                QuizQuestion.is_active == True
            ).count()
            
            # Count by difficulty
            difficulty_stats = {}
            for difficulty in DifficultyEnum:
                count = self.db.query(QuizQuestion).filter(
                    QuizQuestion.difficulty == difficulty,
                    QuizQuestion.is_active == True
                ).count()
                difficulty_stats[difficulty.value] = count
            
            # Count by topic
            topics = self.db.query(QuizQuestion.topic).filter(
                QuizQuestion.is_active == True
            ).distinct().all()
            
            topic_stats = {}
            for (topic,) in topics:
                count = self.db.query(QuizQuestion).filter(
                    QuizQuestion.topic == topic,
                    QuizQuestion.is_active == True
                ).count()
                topic_stats[topic] = count
            
            return {
                "total_questions": total_questions,
                "difficulty_distribution": difficulty_stats,
                "topic_distribution": topic_stats,
                "available_topics": [topic for (topic,) in topics]
            }
            
        except Exception as e:
            logger.error("Failed to get question bank stats", error=str(e))
            return {"total_questions": 0, "difficulty_distribution": {}, "topic_distribution": {}}
