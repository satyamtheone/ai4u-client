# cache_manager.py
import redis
import json
import hashlib
from typing import Optional, Dict, Any

class CacheManager:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.default_ttl = 3600  # 1 hour
    
    async def cache_code_analysis(self, code: str, analysis: Dict) -> str:
        """Cache code analysis results"""
        code_hash = hashlib.md5(code.encode()).hexdigest()
        cache_key = f"analysis:{code_hash}"
        
        await self.redis.setex(
            cache_key,
            self.default_ttl * 24,  # 24 hours for analysis
            json.dumps(analysis)
        )
        
        return code_hash
    
    async def get_cached_analysis(self, code: str) -> Optional[Dict]:
        """Retrieve cached analysis"""
        code_hash = hashlib.md5(code.encode()).hexdigest()
        cache_key = f"analysis:{code_hash}"
        
        cached = await self.redis.get(cache_key)
        return json.loads(cached) if cached else None
    
    async def cache_questions(self, session_id: str, questions: List[Dict]) -> None:
        """Cache generated questions"""
        cache_key = f"questions:{session_id}"
        await self.redis.setex(
            cache_key,
            self.default_ttl,
            json.dumps(questions)
        )
    
    async def rate_limit_check(self, user_id: str, action: str) -> bool:
        """Check rate limits per user"""
        cache_key = f"rate_limit:{user_id}:{action}"
        current = await self.redis.get(cache_key)
        
        if current is None:
            await self.redis.setex(cache_key, 3600, 1)  # 1 hour window
            return True
        
        limits = {
            'code_generation': 100,  # 100 per hour
            'quiz_submission': 200   # 200 per hour
        }
        
        if int(current) >= limits.get(action, 50):
            return False
        
        await self.redis.incr(cache_key)
        return True