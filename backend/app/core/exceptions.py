"""
Custom exception classes for the application.

This module defines custom exceptions for better error handling
and more specific error messages throughout the application.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class AppException(Exception):
    """Base exception class for all application exceptions."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Initialize the exception.
        
        Args:
            message: Error message
            status_code: HTTP status code
            details: Additional error details
        """
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(AppException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)


class AuthorizationError(AppException):
    """Raised when user doesn't have permission."""
    
    def __init__(self, message: str = "Permission denied", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)


class NotFoundError(AppException):
    """Raised when a resource is not found."""
    
    def __init__(self, resource: str, identifier: Any, details: Optional[Dict[str, Any]] = None) -> None:
        message = f"{resource} with identifier '{identifier}' not found"
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)


class ValidationError(AppException):
    """Raised when validation fails."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class ConflictError(AppException):
    """Raised when there's a conflict (e.g., duplicate resource)."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, status.HTTP_409_CONFLICT, details)


class DatabaseError(AppException):
    """Raised when database operation fails."""
    
    def __init__(self, message: str = "Database operation failed", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, details)


class ExternalServiceError(AppException):
    """Raised when external service call fails."""
    
    def __init__(self, service: str, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        full_message = f"{service} service error: {message}"
        super().__init__(full_message, status.HTTP_503_SERVICE_UNAVAILABLE, details)


class RateLimitError(AppException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, details)


class FileUploadError(AppException):
    """Raised when file upload fails."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, status.HTTP_400_BAD_REQUEST, details)


def handle_exception(exc: AppException) -> HTTPException:
    """
    Convert custom exception to HTTPException.
    
    Args:
        exc: Custom application exception
        
    Returns:
        HTTPException with appropriate status code and detail
    """
    return HTTPException(
        status_code=exc.status_code,
        detail={
            "message": exc.message,
            "details": exc.details
        }
    )
