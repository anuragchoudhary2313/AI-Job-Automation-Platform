"""
Enhanced main application with health checks and fault tolerance.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from app.api.api import api_router
from app.api.endpoints import websockets
from app.core.config import settings
from app.core.rate_limit import RateLimitMiddleware, StrictRateLimitMiddleware
from app.core.csrf import CSRFProtectionMiddleware
# from app.services.scheduler import start_scheduler, shutdown_scheduler, health_check_scheduler
from app.scheduler.scheduler import start_scheduler, shutdown_scheduler, get_scheduler

import logging
from app.core.logging import setup_logging, get_logger
from app.core.error_handlers import setup_error_handlers

# Configure logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager with health checks."""
    # Startup
    logger.info("Starting application...")
    
    try:
        # Initialize Database (MongoDB)
        from app.db.mongo import init_db
        await init_db()
        
        # Start scheduler
        start_scheduler()
        
        # Start scheduler health check
        # asyncio.create_task(health_check_scheduler())
        
        logger.info("Application started successfully")
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    try:
        shutdown_scheduler()
        logger.info("Application shut down successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}", exc_info=True)


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if not settings.is_production else None,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Enable XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Strict Transport Security (HTTPS only)
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Content Security Policy
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://cdn.jsdelivr.net"
    )
    
    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Permissions Policy
    response.headers["Permissions-Policy"] = (
        "geolocation=(), "
        "microphone=(), "
        "camera=()"
    )
    
    return response


from app.core.middleware import LoggingMiddleware

# Setup error handlers (must be done before other middleware)
setup_error_handlers(app)

# Logging Middleware
app.add_middleware(LoggingMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS if not settings.is_production else settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

# Trusted Host Middleware (prevent host header injection)
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# GZip Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Rate Limiting
if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(
        RateLimitMiddleware,
        calls=settings.RATE_LIMIT_CALLS,
        period=settings.RATE_LIMIT_PERIOD
    )
    app.add_middleware(StrictRateLimitMiddleware)

# CSRF Protection
if settings.ENABLE_CSRF_PROTECTION and settings.is_production:
    app.add_middleware(
        CSRFProtectionMiddleware,
        secret_key=settings.CSRF_SECRET_KEY or settings.SECRET_KEY
    )

# Include routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(websockets.router, tags=["websockets"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to AI Job Automation Platform API"}


@app.get("/health")
async def health_check():
    """
    Health check endpoint with detailed status.
    """
    from app.scheduler.scheduler import get_scheduler
    
    scheduler = get_scheduler()
    
    health_status = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
        "scheduler": {
            "running": scheduler.running if scheduler else False,
            "jobs": len(scheduler.get_jobs()) if scheduler and scheduler.running else 0
        }
    }
    
    return health_status
