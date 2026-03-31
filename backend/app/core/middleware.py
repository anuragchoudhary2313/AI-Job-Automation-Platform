import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from app.core.logging import get_logger

logger = get_logger(__name__)


class _RequestMetricsStore:
    """In-memory request metrics store for lightweight observability."""

    def __init__(self):
        self.started_at = time.time()
        self.total_requests = 0
        self.total_errors = 0
        self.total_duration_ms = 0.0
        self.by_path: dict[str, dict[str, float | int]] = {}

    def record(self, path: str, duration_ms: float, status_code: int) -> None:
        self.total_requests += 1
        self.total_duration_ms += duration_ms
        if status_code >= 400:
            self.total_errors += 1

        bucket = self.by_path.setdefault(
            path,
            {
                "count": 0,
                "errors": 0,
                "duration_ms_total": 0.0,
                "duration_ms_max": 0.0,
            },
        )
        bucket["count"] = int(bucket["count"]) + 1
        if status_code >= 400:
            bucket["errors"] = int(bucket["errors"]) + 1
        bucket["duration_ms_total"] = float(bucket["duration_ms_total"]) + duration_ms
        bucket["duration_ms_max"] = max(float(bucket["duration_ms_max"]), duration_ms)

    def snapshot(self) -> dict:
        uptime_sec = max(time.time() - self.started_at, 0.001)
        avg_ms = self.total_duration_ms / self.total_requests if self.total_requests else 0.0
        rps = self.total_requests / uptime_sec

        top_paths = []
        for path, stats in self.by_path.items():
            count = int(stats["count"])
            avg_path_ms = float(stats["duration_ms_total"]) / count if count else 0.0
            top_paths.append(
                {
                    "path": path,
                    "count": count,
                    "errors": int(stats["errors"]),
                    "avg_ms": round(avg_path_ms, 2),
                    "max_ms": round(float(stats["duration_ms_max"]), 2),
                }
            )

        top_paths.sort(key=lambda p: p["count"], reverse=True)

        return {
            "uptime_sec": round(uptime_sec, 2),
            "requests_total": self.total_requests,
            "errors_total": self.total_errors,
            "error_rate": round((self.total_errors / self.total_requests) if self.total_requests else 0.0, 4),
            "rps": round(rps, 2),
            "latency_avg_ms": round(avg_ms, 2),
            "top_paths": top_paths[:20],
        }


_metrics_store = _RequestMetricsStore()


def get_request_metrics_snapshot() -> dict:
    return _metrics_store.snapshot()

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


class RequestMetricsMiddleware(BaseHTTPMiddleware):
    """Collect lightweight request metrics without external dependencies."""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start) * 1000
            _metrics_store.record(request.url.path, duration_ms, response.status_code)
            response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"
            return response
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            _metrics_store.record(request.url.path, duration_ms, 500)
            raise
