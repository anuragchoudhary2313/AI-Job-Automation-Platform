"""
Error handling middleware for production-safe error responses.

This middleware:
- Catches all unhandled exceptions
- Logs errors with full context
- Returns sanitized error responses to clients
- Prevents sensitive information leakage
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
import uuid
from typing import Union

from app.core.config import settings
from app.core.logging import log_error

logger = logging.getLogger(__name__)


async def error_handling_middleware(request: Request, call_next):
    """
    Global error handling middleware.
    
    Catches all unhandled exceptions and returns appropriate responses.
    """
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    try:
        response = await call_next(request)
        return response
        
    except Exception as exc:
        # Log the error with full context
        log_error(exc, request_id=request_id)
        
        # Determine response based on exception type
        if isinstance(exc, StarletteHTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": exc.detail,
                    "request_id": request_id
                }
            )
        
        # For all other exceptions, return generic error in production
        if settings.is_production:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred. Please try again later.",
                    "detail": "An unexpected error occurred. Please try again later.",
                    "request_id": request_id
                }
            )
        else:
            # In development, return detailed error
            message = str(exc)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Internal server error",
                    "message": message,
                    "detail": message,
                    "type": type(exc).__name__,
                    "traceback": traceback.format_exc(),
                    "request_id": request_id
                }
            )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors with detailed field-level errors.
    """
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    # Extract validation errors
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error: {errors}", extra={"request_id": request_id})
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation error",
            "message": "Request validation failed",
            "detail": errors,
            "errors": errors,
            "request_id": request_id
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle HTTP exceptions with consistent format.
    """
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    # Log 4xx and 5xx errors
    if exc.status_code >= 400:
        log_level = logging.ERROR if exc.status_code >= 500 else logging.WARNING
        logger.log(
            log_level,
            f"HTTP {exc.status_code}: {exc.detail}",
            extra={"request_id": request_id}
        )
    
    # Sanitize error message in production for 5xx errors
    detail = exc.detail
    if settings.is_production and exc.status_code >= 500:
        detail = "Internal server error"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": detail,
            "message": detail if not settings.is_production else "Please contact support if the problem persists.",
            "detail": detail,
            "request_id": request_id
        }
    )


from app.core.exceptions import AppException

async def app_exception_handler(request: Request, exc: AppException):
    """
    Handle custom application exceptions.
    """
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    # Log 5xx errors as errors, others as warnings/info
    if exc.status_code >= 500:
        logger.error(f"App error: {exc.message}", extra={"request_id": request_id, "details": exc.details})
    else:
        logger.info(f"App info: {exc.message}", extra={"request_id": request_id})
        
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "message": exc.message,
            "detail": {"message": exc.message, "details": exc.details},
            "request_id": request_id
        }
    )


def setup_error_handlers(app):
    """
    Register error handlers with FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(AppException, app_exception_handler)
    app.middleware("http")(error_handling_middleware)
    
    logger.info("Error handlers registered")
