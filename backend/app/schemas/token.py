"""
Token schemas for authentication.
"""
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Access token response."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Refresh token request."""
    refresh_token: str


class TokenPayload(BaseModel):
    """Token payload data."""
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None
