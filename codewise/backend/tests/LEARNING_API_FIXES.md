# Learning API Fixes

## Chat Endpoint Fix

### Problem
The chat endpoint (`POST /api/v1/learning/chat`) was throwing an error when OpenAI API key was not configured:
```
ValueError: OpenAI API key not configured
```

### Solution
Modified `services/chat_service.py` to:
1. ✅ Check if OpenAI API key is configured
2. ✅ Return intelligent default responses when key is missing
3. ✅ Gracefully handle OpenAI API errors
4. ✅ Fall back to default responses on timeout or failures

### Changes Made

**File:** `backend/services/chat_service.py`

#### 1. Updated `_call_openai_api` method
- Added check for missing/empty OpenAI API key
- Added fallback to default response on API errors
- Added fallback on timeout exceptions

#### 2. Added `_generate_default_response` method
Smart default responses based on user input:

| User Input | Default Response |
|------------|------------------|
| "hello", "hi", "hey" | Welcome message + info about OpenAI configuration |
| "help", "assist" | List of available features (quizzes, progress, stats) |
| "what", "how", "why" | Question acknowledgment + demo mode info |
| "quiz", "learn" | Encouragement to try quiz endpoints |
| "thanks" | Appreciation + learning encouragement |
| "bye", "goodbye" | Farewell message |
| Other | Generic message explaining demo mode capabilities |

## How to Test

### Test Without OpenAI Key

1. **Ensure OpenAI key is not set:**
   ```bash
   # Remove or comment out OPENAI_API_KEY in .env
   # OPENAI_API_KEY=
   ```

2. **Start the API server:**
   ```bash
   cd backend
   python codewise_app.py
   ```

3. **Test with curl:**
   ```bash
   # Login first to get access token
   curl -X POST http://localhost:8001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "your_password"
     }'

   # Use the access_token from response
   export TOKEN="your_access_token_here"

   # Test chat endpoint with greeting
   curl -X POST http://localhost:8001/api/v1/learning/chat \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "message": "Hello!",
       "enable_learning_gates": false
     }'

   # Test with question
   curl -X POST http://localhost:8001/api/v1/learning/chat \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "message": "How do I learn programming?",
       "enable_learning_gates": false
     }'

   # Test with help request
   curl -X POST http://localhost:8001/api/v1/learning/chat \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "message": "help",
       "enable_learning_gates": false
     }'
   ```

### Expected Response (Without OpenAI Key)

```json
{
  "success": true,
  "message": "Chat processed successfully",
  "data": {
    "type": "chat_response",
    "response": "Hello! I'm here to help you learn. OpenAI integration is currently not configured, but I can still assist you with basic responses and learning quizzes.",
    "session_id": "uuid-here",
    "message_id": "uuid-here",
    "timestamp": "2025-10-20T14:00:00"
  }
}
```

### Test With OpenAI Key

1. **Set OpenAI key:**
   ```bash
   # Add to .env
   OPENAI_API_KEY=sk-your-actual-openai-key
   ```

2. **Restart server and test:**
   ```bash
   curl -X POST http://localhost:8001/api/v1/learning/chat \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "message": "Explain what is REST API",
       "enable_learning_gates": false
     }'
   ```

### Expected Response (With OpenAI Key)

```json
{
  "success": true,
  "message": "Chat processed successfully",
  "data": {
    "type": "chat_response",
    "response": "REST API stands for Representational State Transfer Application Programming Interface. It is an architectural style for designing networked applications...",
    "session_id": "uuid-here",
    "message_id": "uuid-here",
    "timestamp": "2025-10-20T14:00:00"
  }
}
```

## Testing with Learning Gates Enabled

```bash
# Test with learning gates enabled
curl -X POST http://localhost:8001/api/v1/learning/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Hello",
    "enable_learning_gates": true,
    "gate_frequency": 2
  }'
```

If learning gate is triggered, you'll get:

```json
{
  "success": true,
  "message": "Chat processed successfully",
  "data": {
    "type": "learning_gate",
    "message": "Complete this quiz to unlock AI responses!",
    "question": {
      "id": "uuid",
      "question": "What is Python?",
      "question_type": "single_choice",
      "options": ["A language", "A snake", "A framework", "A database"],
      "difficulty": "easy",
      "topic": "programming"
    },
    "stats": {
      "total_questions": 10,
      "correct_answers": 8,
      "accuracy": 80.0,
      "streak": 3,
      "level": 2,
      "unlocked_responses": 5
    },
    "session_id": "uuid-here",
    "timestamp": "2025-10-20T14:00:00"
  }
}
```

## Benefits of This Fix

1. ✅ **No Configuration Required** - API works out of the box without OpenAI
2. ✅ **Graceful Degradation** - Falls back to default responses on errors
3. ✅ **Smart Responses** - Context-aware default messages
4. ✅ **Better UX** - Users understand what's happening
5. ✅ **Easy Setup** - Add OpenAI key anytime to enable full AI features
6. ✅ **Error Handling** - Handles timeouts and API failures gracefully

## Next Steps

- [ ] Add integration tests for chat endpoint
- [ ] Test with learning gates enabled
- [ ] Test quiz submission endpoints
- [ ] Test stats and progress endpoints
- [ ] Add more intelligent default responses
- [ ] Consider adding offline AI model support (optional)

## API Endpoints Summary

| Endpoint | Method | Purpose | Requires Auth |
|----------|--------|---------|---------------|
| `/api/v1/learning/chat` | POST | Chat with AI | ✅ Yes |
| `/api/v1/learning/quiz/submit` | POST | Submit quiz answer | ✅ Yes |
| `/api/v1/learning/quiz/submit-batch` | POST | Submit multiple answers | ✅ Yes |
| `/api/v1/learning/quiz/skip` | POST | Skip current quiz | ✅ Yes |
| `/api/v1/learning/questions` | GET | Get quiz questions | ✅ Yes |
| `/api/v1/learning/stats` | GET | Get user stats | ✅ Yes |
| `/api/v1/learning/progress` | GET | Get user progress | ✅ Yes |
| `/api/v1/learning/progress/reset` | POST | Reset progress | ✅ Yes |
| `/api/v1/learning/admin/questions` | POST | Create quiz question | ✅ Yes (Admin) |
| `/api/v1/learning/admin/questions` | GET | List quiz questions | ✅ Yes (Admin) |

## Date
Fixed: October 20, 2025
