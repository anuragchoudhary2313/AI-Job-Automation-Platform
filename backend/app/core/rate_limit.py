"""
Rate limiting middleware to prevent abuse and DDoS attacks.
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Tuple
from datetime import datetime, timedelta
import asyncio
from collections import defaultdict


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using token bucket algorithm.
    """
    
    def __init__(self, app, calls: int = 100, period: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            app: FastAPI application
            calls: Number of calls allowed per period
            period: Time period in seconds
        """
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients: Dict[str, Tuple[int, datetime]] = defaultdict(
            lambda: (calls, datetime.now())
        )
        
        # Start cleanup task
        asyncio.create_task(self._cleanup_old_entries())
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request with rate limiting.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler
            
        Returns:
            Response or rate limit error
        """
        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "127.0.0.1"
        
        # Skip rate limiting for health check endpoints
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Check rate limit
        is_allowed, retry_after = self._check_rate_limit(client_ip)
        
        if not is_allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining, reset_time = self.clients[client_ip]
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(reset_time.timestamp()))
        
        return response
    
    def _check_rate_limit(self, client_ip: str) -> Tuple[bool, int]:
        """
        Check if client has exceeded rate limit.
        
        Args:
            client_ip: Client IP address
            
        Returns:
            Tuple of (is_allowed, retry_after_seconds)
        """
        now = datetime.now()
        tokens, last_update = self.clients[client_ip]
        
        # Calculate time elapsed
        time_passed = (now - last_update).total_seconds()
        
        # Refill tokens based on time passed
        tokens_to_add = int(time_passed * (self.calls / self.period))
        tokens = min(self.calls, tokens + tokens_to_add)
        
        # Update last update time if tokens were added
        if tokens_to_add > 0:
            last_update = now
        
        # Check if request is allowed
        if tokens > 0:
            tokens -= 1
            self.clients[client_ip] = (tokens, last_update)
            return True, 0
        else:
            # Calculate retry after time
            retry_after = int(self.period - time_passed)
            return False, max(1, retry_after)
    
    async def _cleanup_old_entries(self):
        """
        Periodically cleanup old client entries to prevent memory leak.
        """
        while True:
            await asyncio.sleep(3600)  # Run every hour
            
            now = datetime.now()
            cutoff = now - timedelta(hours=1)
            
            # Remove entries older than 1 hour
            self.clients = {
                ip: (tokens, last_update)
                for ip, (tokens, last_update) in self.clients.items()
                if last_update > cutoff
            }


# Stricter rate limits for sensitive endpoints
class StrictRateLimitMiddleware(RateLimitMiddleware):
    """
    Stricter rate limiting for authentication endpoints.
    """
    
    def __init__(self, app):
        # 5 calls per minute for auth endpoints
        super().__init__(app, calls=5, period=60)
    
    async def dispatch(self, request: Request, call_next):
        """
        Apply strict rate limiting only to auth endpoints.
        """
        auth_paths = ["/api/v1/auth/login", "/api/v1/auth/register"]
        
        if request.url.path in auth_paths:
            return await super().dispatch(request, call_next)
        
        return await call_next(request)


def get_rate_limit_key(request: Request) -> str:
    """
    Get rate limit key for request.
    Can be based on IP, user ID, or API key.
    
    Args:
        request: Incoming request
        
    Returns:
        Rate limit key
    """
    # Try to get user ID from token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from app.core.security import decode_token
            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass
    
    # Fall back to IP address
    return f"ip:{request.client.host if request.client else '127.0.0.1'}"
