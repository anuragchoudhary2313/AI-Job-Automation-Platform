"""
CSRF protection middleware.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers
import secrets
import hashlib
from typing import Optional


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection using double-submit cookie pattern.
    """
    
    def __init__(self, app, secret_key: str):
        super().__init__(app)
        self.secret_key = secret_key
        self.safe_methods = {"GET", "HEAD", "OPTIONS", "TRACE"}
        self.exempt_paths = {"/docs", "/openapi.json", "/health"}
    
    async def dispatch(self, request: Request, call_next):
        """
        Validate CSRF token for unsafe methods.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler
            
        Returns:
            Response or CSRF error
        """
        # Skip CSRF check for safe methods
        if request.method in self.safe_methods:
            response = await call_next(request)
            # Set CSRF token cookie for safe requests
            if not request.cookies.get("csrf_token"):
                csrf_token = self._generate_csrf_token()
                response.set_cookie(
                    key="csrf_token",
                    value=csrf_token,
                    httponly=True,
                    secure=True,
                    samesite="lax"
                )
            return response
        
        # Skip CSRF check for exempt paths
        if request.url.path in self.exempt_paths:
            return await call_next(request)
        
        # Validate CSRF token for unsafe methods
        cookie_token = request.cookies.get("csrf_token")
        header_token = request.headers.get("X-CSRF-Token")
        
        if not cookie_token or not header_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing"
            )
        
        if not self._validate_csrf_token(cookie_token, header_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token invalid"
            )
        
        return await call_next(request)
    
    def _generate_csrf_token(self) -> str:
        """Generate a new CSRF token."""
        return secrets.token_urlsafe(32)
    
    def _validate_csrf_token(self, cookie_token: str, header_token: str) -> bool:
        """
        Validate CSRF token using constant-time comparison.
        
        Args:
            cookie_token: Token from cookie
            header_token: Token from header
            
        Returns:
            True if tokens match, False otherwise
        """
        return secrets.compare_digest(cookie_token, header_token)
