import redis.asyncio as redis
from typing import Optional, Any
import json
import structlog
from app.core.config import settings

logger = structlog.get_logger(__name__)

class RedisClient:
    """Redis client for caching and session management"""
    
    def __init__(self):
        self.redis_pool = None
    
    async def connect(self):
        """Initialize Redis connection pool"""
        try:
            self.redis_pool = redis.ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=20,
                retry_on_timeout=True
            )
            logger.info("Redis connection pool initialized")
        except Exception as e:
            logger.error("Failed to initialize Redis", error=str(e))
            raise
    
    async def get_client(self) -> redis.Redis:
        """Get Redis client instance"""
        if not self.redis_pool:
            await self.connect()
        return redis.Redis(connection_pool=self.redis_pool)
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        expire: Optional[int] = None
    ) -> bool:
        """Set value in Redis with optional expiration"""
        try:
            client = await self.get_client()
            serialized_value = json.dumps(value) if not isinstance(value, str) else value
            result = await client.set(key, serialized_value, ex=expire)
            return bool(result)
        except Exception as e:
            logger.error("Redis SET failed", key=key, error=str(e))
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        try:
            client = await self.get_client()
            value = await client.get(key)
            if value is None:
                return None
            
            # Try to decode as JSON, fallback to string
            try:
                return json.loads(value.decode())
            except (json.JSONDecodeError, UnicodeDecodeError):
                return value.decode()
        except Exception as e:
            logger.error("Redis GET failed", key=key, error=str(e))
            return None