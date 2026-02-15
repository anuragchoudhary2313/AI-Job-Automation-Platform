import logging
import sys
import json
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from typing import List
from datetime import datetime
from app.core.config import settings

# Prevent duplicate logging
_setup_done = False

class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs structured JSON logs in production.
    """
    def format(self, record: logging.LogRecord) -> str:
        if settings.is_production:
            # Structured JSON logging for production
            log_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
            }
            
            # Add exception info if present
            if record.exc_info:
                log_data["exception"] = self.formatException(record.exc_info)
            
            # Add extra fields if present
            if hasattr(record, "request_id"):
                log_data["request_id"] = record.request_id
            if hasattr(record, "user_id"):
                log_data["user_id"] = record.user_id
            if hasattr(record, "team_id"):
                log_data["team_id"] = record.team_id
            
            return json.dumps(log_data)
        else:
            # Human-readable format for development
            return super().format(record)


def setup_logging():
    """
    Configure the logging system based on environment settings.
    This should be called once at application startup.
    
    Features:
    - Console logging (stdout)
    - File logging with rotation
    - Structured JSON logs in production
    - Request tracking
    - Error file for ERROR+ logs
    """
    global _setup_done
    if _setup_done:
        return

    # Determine log level
    log_level = settings.LOG_LEVEL.upper() if hasattr(settings, "LOG_LEVEL") else "INFO"
    if settings.DEBUG:
        log_level = "DEBUG"

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Define formats
    if settings.is_production:
        # Structured JSON format for production
        formatter = StructuredFormatter()
    else:
        # Human-readable format for development
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        formatter = logging.Formatter(log_format)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))
    
    # Remove existing handlers to avoid duplicates
    root_logger.handlers.clear()

    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level))
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler - All logs with rotation
    all_logs_handler = RotatingFileHandler(
        log_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding="utf-8"
    )
    all_logs_handler.setLevel(getattr(logging, log_level))
    all_logs_handler.setFormatter(formatter)
    root_logger.addHandler(all_logs_handler)

    # File handler - Error logs only
    error_handler = RotatingFileHandler(
        log_dir / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding="utf-8"
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)

    # Daily rotating handler for audit logs
    if settings.is_production:
        audit_handler = TimedRotatingFileHandler(
            log_dir / "audit.log",
            when="midnight",
            interval=1,
            backupCount=30,  # Keep 30 days
            encoding="utf-8"
        )
        audit_handler.setLevel(logging.INFO)
        audit_handler.setFormatter(formatter)
        
        # Only add audit logs for specific loggers
        audit_logger = logging.getLogger("app.audit")
        audit_logger.addHandler(audit_handler)

    # Reduce noise from third-party libraries
    noisy_loggers = [
        "uvicorn.access", "uvicorn.error", "sqlalchemy.engine", 
        "httpx", "httpcore", "faker", "asyncio"
    ]
    
    for logger_name in noisy_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)
    
    # Explicitly set app logger level
    app_logger = logging.getLogger("app")
    app_logger.setLevel(getattr(logging, log_level))
    
    # Startup message
    mode = "DEBUG" if settings.DEBUG else "PRODUCTION"
    logging.getLogger("app.core.logging").info(
        f"Logging initialized. Mode: {mode}, Level: {log_level}, "
        f"Logs directory: {log_dir.absolute()}"
    )
    
    _setup_done = True


def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance.
    Standardizes usage across the app.
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


def log_request(request_id: str, method: str, path: str, user_id: int = None, team_id: int = None):
    """
    Log incoming HTTP request with tracking info.
    
    Args:
        request_id: Unique request identifier
        method: HTTP method
        path: Request path
        user_id: User ID if authenticated
        team_id: Team ID if applicable
    """
    logger = get_logger("app.requests")
    extra = {
        "request_id": request_id,
        "user_id": user_id,
        "team_id": team_id
    }
    logger.info(f"{method} {path}", extra=extra)


def log_error(error: Exception, request_id: str = None, user_id: int = None):
    """
    Log error with context.
    
    Args:
        error: Exception instance
        request_id: Request ID if applicable
        user_id: User ID if applicable
    """
    logger = get_logger("app.errors")
    extra = {}
    if request_id:
        extra["request_id"] = request_id
    if user_id:
        extra["user_id"] = user_id
    
    logger.error(f"Error: {str(error)}", exc_info=True, extra=extra)


def log_audit(action: str, user_id: int, resource: str, details: dict = None):
    """
    Log audit trail for important actions.
    
    Args:
        action: Action performed (e.g., "user_login", "resume_delete")
        user_id: User performing action
        resource: Resource affected
        details: Additional details
    """
    logger = get_logger("app.audit")
    log_data = {
        "action": action,
        "user_id": user_id,
        "resource": resource,
        "details": details or {}
    }
    logger.info(f"Audit: {action}", extra=log_data)

