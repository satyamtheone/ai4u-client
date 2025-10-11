# Multi-Tenancy FastAPI Application with Learning Gates

A mission-critical multi-tenancy application built with FastAPI, PostgreSQL, and Redis, featuring comprehensive SSO support, enterprise-grade security, and an innovative Learning Gates system for interactive AI education.

## 🚀 Features

### Core Platform
- **Multi-Tenancy**: Support for both individual users and organizations
- **Authentication**: Email/password and Google OAuth SSO
- **Authorization**: Role-based access control (RBAC) with fine-grained permissions
- **Security**: JWT tokens, password hashing, rate limiting, audit logging
- **Performance**: Optimized database schema with indexing and partitioning
- **Observability**: Structured logging, health checks, metrics
- **Scalability**: Designed to handle millions of users

### 🎓 Learning Gates System
- **Interactive Learning**: AI chat with educational quiz interruptions
- **Personalized Questions**: Adaptive difficulty based on user progress
- **Multiple Question Types**: Single choice, multiple choice, and short answer
- **Progress Tracking**: Levels, streaks, accuracy metrics
- **Unlocked Responses**: Earn AI responses by completing quizzes
- **Organization Support**: Custom question banks per organization

## Quick Start

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd multitenancy-app
   cp .env.example .env
   # Edit .env with your OpenAI API key and other settings
   ```

2. **Start development environment**
   ```bash
   make dev-setup
   ```

3. **Access the application**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## 🎯 Learning Gates API Endpoints

### Chat with Learning Gates
```bash
# Normal chat (no learning gates)
POST /api/v1/learning/chat
{
  "message": "Explain JavaScript closures",
  "enable_learning_gates": false
}

# Chat with learning gates enabled
POST /api/v1/learning/chat?learning_gates=true
{
  "message": "How do I use React hooks?",
  "enable_learning_gates": true,
  "gate_frequency": 2
}
```

### Quiz Management
```bash
# Get personalized quiz questions
GET /api/v1/learning/questions?count=3&difficulty=mixed

# Submit quiz answer
POST /api/v1/learning/quiz/submit
{
  "question_id": "uuid",
  "selected_answer": 1,
  "answer_type": "single_choice",
  "time_taken": 30
}

# Submit batch quiz
POST /api/v1/learning/quiz/submit-batch
{
  "answers": [
    {
      "question_id": "uuid",
      "selected_answer": 1,
      "answer_type": "single_choice"
    }
  ]
}

# Skip quiz (get limited responses)
POST /api/v1/learning/quiz/skip
```

### Progress Tracking
```bash
# Get user learning statistics
GET /api/v1/learning/stats

# Get detailed progress
GET /api/v1/learning/progress

# Reset progress
POST /api/v1/learning/progress/reset
```

## 🔧 Configuration

### Environment Variables
```bash
# Core settings
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/multitenancy_app
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-super-secret-key

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI (Required for Learning Gates)
OPENAI_API_KEY=your-openai-api-key

# Learning Gates settings
DEFAULT_GATE_FREQUENCY=2
MAX_QUESTIONS_PER_BATCH=10
```

## 🎮 How Learning Gates Work

1. **User starts chat** with learning gates enabled
2. **System tracks messages** and triggers quiz based on frequency
3. **User gets quiz question** instead of AI response
4. **Correct answers unlock** multiple AI responses
5. **Progress tracking** with levels, streaks, and analytics

### Example Learning Flow
```
User: "How do I use async/await in JavaScript?"
System: [Shows quiz about JavaScript basics]
User: [Answers correctly]
System: "Great! You unlocked 3 AI responses. Here's how async/await works..."
```

## 🏗 Architecture

### Database Schema
```
quiz_questions     - Question bank with multiple types
user_progress      - Individual learning progress
quiz_submissions   - Answer history and analytics
chat_sessions      - AI chat sessions with settings
chat_messages      - Conversation history
```

### Learning Features
- **Adaptive Difficulty**: Questions adapt to user level
- **Smart Frequency**: Learning gates appear based on user activity
- **Multiple Question Types**: Single/multiple choice, short answer
- **    
    # Application
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 1000

    # Learning Gates (NEW)
    DEFAULT_GATE_FREQUENCY: int = 2
    MAX_QUESTIONS_PER_BATCH: int = 10
    DEFAULT_UNLOCKED_RESPONSES: int = 3

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()


## For Fresh DataLoad & Table create
docker compose down
docker volume rm codewise_postgres_data
make dev-setup


