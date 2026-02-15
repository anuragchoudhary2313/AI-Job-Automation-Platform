import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from app.core.logging import get_logger

logger = get_logger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log request and response details.
    """
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Log Request
        client_host = request.client.host if request.client else "unknown"
        logger.info(
            f"Wait Request: {request.method} {request.url.path} from {client_host}",
            extra={"request_id": request_id}
        )
        
        try:
            response = await call_next(request)
            
            process_time = (time.time() - start_time) * 1000
            
            # Log Response
            logger.info(
                f"Completed: {response.status_code} in {process_time:.2f}ms",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "duration_ms": process_time
                }
            )
            
            # Add Request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Error handling middleware usually catches this, but just in case
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"Request Failed: {str(e)} in {process_time:.2f}ms",
                exc_info=True,
                extra={"request_id": request_id, "duration_ms": process_time}
            )
            raise e
