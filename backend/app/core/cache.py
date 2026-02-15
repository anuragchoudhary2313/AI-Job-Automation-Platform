"""
Redis caching utilities for performance optimization.
"""
import redis.asyncio as redis
import json
import logging
from typing import Optional, Any, Callable
from functools import wraps
import hashlib

from app.core.config import settings

logger = logging.getLogger(__name__)

# Redis client
redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """Get Redis client instance."""
    global redis_client
    
    if redis_client is None:
        redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    return redis_client


async def close_redis_client():
    """Close Redis client connection."""
    global redis_client
    
    if redis_client:
        await redis_client.close()
        redis_client = None


class Cache:
    """Redis cache wrapper."""
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
    
    async def _get_client(self) -> redis.Redis:
        """Get or create Redis client."""
        if self.client is None:
            self.client = await get_redis_client()
        return self.client
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        try:
            client = await self._get_client()
            value = await client.get(key)
            
            if value:
                return json.loads(value)
            
            return None
            
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        expire: int = 300
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            expire: Expiration time in seconds (default 5 minutes)
            
        Returns:
            True if successful
        """
        try:
            client = await self._get_client()
            serialized = json.dumps(value)
            await client.setex(key, expire, serialized)
            return True
            
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful
        """
        try:
            client = await self._get_client()
            await client.delete(key)
            return True
            
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """
        Clear all keys matching pattern.
        
        Args:
            pattern: Key pattern (e.g., "user:*")
            
        Returns:
            Number of keys deleted
        """
        try:
            client = await self._get_client()
            keys = await client.keys(pattern)
            
            if keys:
                return await client.delete(*keys)
            
            return 0
            
        except Exception as e:
            logger.error(f"Cache clear pattern error for {pattern}: {e}")
            return 0


# Singleton cache instance
cache = Cache()


def cache_key(*args, **kwargs) -> str:
    """
    Generate cache key from function arguments.
    
    Args:
        *args: Positional arguments
        **kwargs: Keyword arguments
        
    Returns:
        Cache key string
    """
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    key_string = ":".join(key_parts)
    
    # Hash long keys
    if len(key_string) > 200:
        return hashlib.md5(key_string.encode()).hexdigest()
    
    return key_string


def cached(expire: int = 300, key_prefix: str = ""):
    """
    Decorator for caching function results.
    
    Args:
        expire: Cache expiration in seconds
        key_prefix: Prefix for cache key
        
    Example:
        @cached(expire=600, key_prefix="user")
        async def get_user(user_id: int):
            return await db.get(User, user_id)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_value = await cache.get(key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {key}")
                return cached_value
            
            # Execute function
            logger.debug(f"Cache miss: {key}")
            result = await func(*args, **kwargs)
            
            # Cache result
            await cache.set(key, result, expire)
            
            return result
        
        return wrapper
    return decorator
