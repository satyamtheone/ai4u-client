# main.py
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from redis import Redis
import asyncio
from typing import List, Dict
import uvicorn

app = FastAPI(title="CodeWise API", version="1.0.0")

# CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["vscode-webview://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connections
engine = create_engine("postgresql://user:pass@localhost/codewise")
redis_client = Redis(host='localhost', port=6379, decode_responses=True)

class CodeWiseBackend:
    def __init__(self):
        self.llm_client = OpenAIClient()
        self.code_analyzer = CodeAnalyzer()
        self.question_generator = QuestionGenerator()
    
    async def generate_code_with_quiz(
        self, 
        prompt: str, 
        language: str,
        user_context: Dict
    ) -> Dict:
        # Generate code
        code = await self.llm_client.generate_code(prompt, language, user_context)
        
        # Analyze code complexity and concepts
        analysis = self.code_analyzer.analyze(code, language)
        
        # Generate contextual questions
        questions = await self.question_generator.generate(code, analysis)
        
        # Cache for quick access
        session_id = f"session_{hash(code)}"
        await redis_client.setex(
            session_id, 
            3600,  # 1 hour expiry
            json.dumps({
                "code": code,
                "questions": questions,
                "analysis": analysis
            })
        )
        
        return {
            "session_id": session_id,
            "locked_code": self.create_locked_preview(code),
            "questions": questions,
            "metadata": analysis
        }

backend = CodeWiseBackend()

@app.post("/api/generate-code")
async def generate_code(request: CodeGenerationRequest):
    try:
        result = await backend.generate_code_with_quiz(
            request.prompt,
            request.language,
            request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/submit-quiz")
async def submit_quiz(request: QuizSubmissionRequest):
    # Validate answers
    session_data = await redis_client.get(request.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = json.loads(session_data)
    score = calculate_score(request.answers, data["questions"])
    
    # Save to database
    await save_quiz_result(request.user_id, request.session_id, score)
    
    if score >= 0.7:  # 70% threshold
        return {
            "passed": True,
            "code": data["code"],
            "score": score,
            "explanation": generate_explanation(data["questions"], request.answers)
        }
    else:
        return {
            "passed": False,
            "score": score,
            "hints": generate_hints(data["questions"], request.answers)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)