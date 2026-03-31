"""Unified operational verification CLI.

This script consolidates previously scattered operational checks into one command
surface so maintenance scripts are easier to discover and run.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
import time
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import requests


# Add backend directory to path so script can import app modules.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _print_error(prefix: str, exc: Exception) -> None:
    print(f"[ERROR] {prefix}: {exc}")


async def verify_email_configuration() -> int:
    """Verify email config by sending a test message to the configured sender."""
    from app.email.sender import email_sender

    print("Testing Email Configuration...")
    print(f"Host: {email_sender.host}:{email_sender.port}")
    print(f"User: {email_sender.user}")
    print(f"SSL: {email_sender.use_ssl}")

    if not email_sender.password or email_sender.password == "CHANGE_ME":
        print("[ERROR] Password not configured in .env")
        return 1

    print("Sending email...")
    try:
        success = await email_sender.send_email(
            to_email=email_sender.user,
            subject="Direct Verification Test",
            html_body="<h1>It Works!</h1><p>This is a direct test from verify_ops.py</p>",
        )
    except Exception as exc:
        _print_error("Exception occurred", exc)
        return 1

    if success:
        print("[OK] Email sent successfully")
        return 0

    print("[ERROR] Failed to send email. Check logs for auth/connection errors")
    return 1


async def _create_dummy_followup_data() -> str:
    """Create dummy records so follow-up checks have deterministic test input."""
    from app.db.models import Job, JobStatus
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        job_kwargs = {
            title="Old Application Developer",
            company="Ghost Corp",
            description="Testing followups",
            location="Remote",
            status=JobStatus.APPLIED,
            applied_at=datetime.now() - timedelta(days=4),
        }

        job = Job(**job_kwargs)
        db.add(job)
        await db.commit()
        await db.refresh(job)

    print(f"Created dummy job: {job.title} applied on {job.applied_at}")
    return str(job.id)


async def verify_followups(seed_dummy_data: bool = True) -> int:
    """Run follow-up scheduler check with optional seed data creation."""
    from app.scheduler.jobs import check_follow_ups_task

    print("Testing Follow-up Logic...")
    try:
        if seed_dummy_data:
            await _create_dummy_followup_data()

        print("Running check_follow_ups_task...")
        await check_follow_ups_task()

        print("[OK] Task executed. Check notification channels for alert output")
        return 0
    except Exception as exc:
        _print_error("Follow-up verification failed", exc)
        return 1


async def verify_telegram_configuration() -> int:
    """Send a direct telegram alert to verify bot token/chat configuration."""
    from app.notifications.telegram import telegram_service

    print("Testing Telegram Configuration...")
    print(
        "Bot Token Configured:",
        "Yes" if telegram_service.bot_token and telegram_service.bot_token != "CHANGE_ME" else "No",
    )
    print(
        "Chat ID Configured:",
        "Yes" if telegram_service.chat_id and telegram_service.chat_id != "CHANGE_ME" else "No",
    )

    if not telegram_service.bot_token or telegram_service.bot_token == "CHANGE_ME":
        print("[ERROR] Telegram bot token not configured in .env")
        return 1

    print("Sending test alert...")
    try:
        success = await telegram_service.send_alert(
            "✅ <b>Direct Verification Test</b>\nSystem is online! 🚀"
        )
    except Exception as exc:
        _print_error("Telegram verification failed", exc)
        return 1

    if success:
        print("[OK] Telegram alert sent successfully")
        return 0

    print("[ERROR] Failed to send Telegram alert. Check logs.")
    return 1


def _verify_security_headers(client) -> bool:
    print("Verifying Security Headers...")
    response = client.get("/")
    headers = response.headers

    expected_headers = {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Content-Security-Policy": None,
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": None,
    }

    all_passed = True
    for header, expected_value in expected_headers.items():
        if header not in headers:
            print(f"FAILED: Missing header {header}")
            all_passed = False
        elif expected_value and headers[header] != expected_value:
            print(
                f"FAILED: {header} value mismatch. Expected '{expected_value}', got '{headers[header]}'"
            )
            all_passed = False
        else:
            print(f"SUCCESS: {header} present")

    return all_passed


def _verify_cors(client) -> bool:
    print("\nVerifying CORS...")
    origin = "http://localhost:3000"
    response = client.get("/health", headers={"Origin": origin})

    value = response.headers.get("access-control-allow-origin")
    if value == origin:
        print(f"SUCCESS: CORS allowed for {origin}")
        return True

    if value:
        print(f"FAILED: CORS allowed origin mismatch: {value}")
    else:
        print("WARNING: CORS header not present in response")
    return False


def _verify_rate_limiting(client) -> bool:
    from app.core.config import settings

    print("\nVerifying Rate Limiting...")
    if not settings.RATE_LIMIT_ENABLED:
        print("Rate limiting is disabled in settings. Skipping.")
        return True

    print(f"Limit: {settings.RATE_LIMIT_CALLS} calls per {settings.RATE_LIMIT_PERIOD}s")

    path = "/api/v1/non-existent-endpoint-for-rate-limit"
    limit = settings.RATE_LIMIT_CALLS
    triggered = False

    start_time = time.time()
    for i in range(limit + 5):
        response = client.get(path)
        if response.status_code == 429:
            print(f"SUCCESS: Rate limit triggered after {i} requests")
            triggered = True
            break

    if not triggered:
        print(f"FAILED: Rate limit NOT triggered after {limit + 5} requests")
        return False

    print(f"Rate limit verification took {time.time() - start_time:.2f}s")
    return True


def verify_security(skip_rate_limit: bool = False) -> int:
    """Verify security headers, CORS behavior, and rate limiting."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    headers_ok = _verify_security_headers(client)
    cors_ok = _verify_cors(client)
    rate_ok = True if skip_rate_limit else _verify_rate_limiting(client)

    if headers_ok and cors_ok and rate_ok:
        print("\n[OK] Security verification completed successfully")
        return 0

    print("\n[ERROR] Security verification detected one or more issues")
    return 1


def verify_local_ai_logic() -> int:
    """Run mocked LocalLLMService checks for primary and fallback model logic."""
    from app.core.config import settings
    from app.services.ai.local_llm import LocalLLMService

    print("Testing LocalLLMService logic...")

    settings.OLLAMA_BASE_URL = "http://localhost:11434"
    settings.OLLAMA_DEFAULT_MODEL = "llama3"
    settings.OLLAMA_FALLBACK_MODEL = "mistral"
    settings.LOCAL_MODEL_LIGHT = "phi-3"

    with patch("app.services.ai.local_llm.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"response": "Success from Llama3"}

        service = LocalLLMService()
        result = service._generate("test prompt")

        if result != "Success from Llama3":
            print(f"[ERROR] Primary model test failed. Got: {result}")
            return 1

        _, kwargs = mock_post.call_args
        if kwargs["json"].get("model") != "llama3":
            print(f"[ERROR] Wrong model used: {kwargs['json'].get('model')}")
            return 1

        mock_post.side_effect = [
            MagicMock(status_code=500),
            MagicMock(status_code=200, json=lambda: {"response": "Success from Mistral"}),
        ]

        result = service._generate("test prompt")
        if result != "Success from Mistral":
            print(f"[ERROR] Fallback model test failed. Got: {result}")
            return 1

    print("[OK] LocalLLMService logic checks passed")
    return 0


def verify_ollama_direct(url: str, model: str, prompt: str, timeout: int) -> int:
    """Verify direct Ollama endpoint connectivity with a single generation request."""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }
    print(f"Sending request to {url} with model '{model}'")

    try:
        response = requests.post(url, json=payload, timeout=timeout)
    except Exception as exc:
        _print_error("Ollama request failed", exc)
        return 1

    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print("Error Response:", response.text)
        return 1

    result = response.json().get("response")
    print("Response:", result)
    print("[OK] Direct Ollama verification succeeded")
    return 0


def verify_ai_endpoints(base_url: str) -> int:
    """Verify AI endpoint responses for bullets, cover letters, and emails."""
    print("Testing AI Endpoints...")

    checks: list[tuple[str, str, dict, callable]] = [
        (
            "resume-bullets",
            "/resume/bullets",
            {
                "bullet": "Led a group of 5 people.",
                "job_description": (
                    "We are looking for a leader who can manage "
                    "cross-functional groups and drive results."
                ),
            },
            lambda output, payload: bool(output) and output != payload["bullet"],
        ),
        (
            "cover-letter",
            "/cover-letter",
            {
                "resume_summary": "Experienced software engineer with 5 years in Python and React.",
                "job_description": "Looking for a full-stack developer.",
                "company_name": "Tech Corp",
            },
            lambda output, _payload: bool(output) and len(output) > 50,
        ),
        (
            "email",
            "/email",
            {
                "template": "Hi, I am interested in the job.",
                "company_name": "Tech Corp",
                "role": "Developer",
            },
            lambda output, payload: bool(output) and output != payload["template"],
        ),
    ]

    all_ok = True
    normalized_base = base_url.rstrip("/")

    for name, path, payload, validator in checks:
        print(f"\nTesting {name} endpoint...")
        try:
            response = requests.post(f"{normalized_base}{path}", json=payload, timeout=30)
        except Exception as exc:
            _print_error(f"{name} request failed", exc)
            all_ok = False
            continue

        if response.status_code != 200:
            print(f"[ERROR] {name} failed: {response.status_code} - {response.text}")
            all_ok = False
            continue

        output = response.json()
        if validator(output, payload):
            print(f"[OK] {name} endpoint responded with valid output")
        else:
            print(f"[ERROR] {name} endpoint returned suspicious/static output")
            all_ok = False

    if all_ok:
        print("\n[OK] AI endpoint verification passed")
        return 0

    print("\n[ERROR] AI endpoint verification detected one or more issues")
    return 1


def verify_error_handlers() -> int:
    """Verify centralized exception handlers via temporary test routes."""
    from fastapi.testclient import TestClient
    from app.core.error_handlers import logger as error_handler_logger
    from app.core.exceptions import AppException, AuthorizationError, NotFoundError
    from app.main import app

    error_handler_logger.setLevel(logging.CRITICAL)

    existing_paths = {
        getattr(route, "path", "")
        for route in app.router.routes
    }

    if "/test/error/not-found" not in existing_paths:
        @app.get("/test/error/not-found")
        def raise_not_found():
            raise NotFoundError(resource="TestResource", identifier="123")

    if "/test/error/auth" not in existing_paths:
        @app.get("/test/error/auth")
        def raise_auth_error():
            raise AuthorizationError("You shall not pass!")

    if "/test/error/generic" not in existing_paths:
        @app.get("/test/error/generic")
        def raise_generic_app_error():
            raise AppException("Something went wrong", status_code=418, details={"reason": "Teapot"})

    client = TestClient(app)
    print("Testing Centralized Error Handlers...")

    response_404 = client.get("/test/error/not-found")
    response_403 = client.get("/test/error/auth")
    response_418 = client.get("/test/error/generic")

    checks = [
        (
            "NotFoundError",
            response_404.status_code == 404
            and response_404.json().get("error") == "TestResource with identifier '123' not found",
        ),
        (
            "AuthorizationError",
            response_403.status_code == 403
            and response_403.json().get("error") == "You shall not pass!",
        ),
        (
            "AppException",
            response_418.status_code == 418
            and response_418.json().get("details", {}).get("reason") == "Teapot",
        ),
    ]

    failed = [name for name, passed in checks if not passed]
    if failed:
        print(f"[ERROR] Error handler verification failed checks: {', '.join(failed)}")
        return 1

    print("[OK] Error handler verification passed")
    return 0


def verify_imports() -> int:
    """Verify config and AI service imports using backend-relative path setup."""
    print("Checking backend import wiring...")
    print(f"Current Dir: {os.path.dirname(os.path.abspath(__file__))}")
    print(f"Backend Dir: {os.path.dirname(os.path.dirname(os.path.abspath(__file__)))}")
    print(f"Sys Path[0]: {sys.path[0]}")

    try:
        from app.core.config import settings

        print(f"[OK] Settings loaded. API key present: {settings.GROQ_API_KEY is not None}")
    except Exception as exc:
        _print_error("Error loading settings", exc)
        return 1

    try:
        from app.services.ai_service import ai_service

        _ = ai_service
        print("[OK] AIService imported")
        return 0
    except Exception as exc:
        _print_error("Error loading AIService", exc)
        return 1


async def verify_windows_scraper(keyword: str, location: str, limit: int) -> int:
    """Run scraper verification against Mongo-backed scraper flow."""
    from app.db.mongo import init_db
    from app.models.job import ScrapedJob
    from app.services.job_scraper import job_scraper_service

    logger.info("Starting scraper verification...")
    try:
        logger.info("Initializing MongoDB...")
        await init_db()

        logger.info(
            "Running scraper for '%s' in '%s' with limit %s",
            keyword,
            location,
            limit,
        )
        result = await job_scraper_service.scrape_jobs(keyword, location, limit=limit)
        logger.info("[OK] Scraper completed successfully: %s", result)

        count = await ScrapedJob.count()
        logger.info("Total scraped jobs in DB: %s", count)
        return 0
    except NotImplementedError:
        logger.error("[ERROR] NotImplementedError occurred while running scraper verification")
        return 1
    except Exception as exc:
        logger.error("[ERROR] Scraper verification failed: %s", exc, exc_info=True)
        return 1


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Backend operational verification commands")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("email", help="Verify outbound email configuration")
    subparsers.add_parser("telegram", help="Verify telegram notification configuration")
    subparsers.add_parser("local-ai", help="Verify LocalLLMService fallback logic")
    subparsers.add_parser("imports", help="Verify backend import path and service imports")
    subparsers.add_parser("error-handlers", help="Verify centralized API exception handlers")

    ai_endpoints_cmd = subparsers.add_parser("ai-endpoints", help="Verify AI HTTP endpoints")
    ai_endpoints_cmd.add_argument(
        "--base-url",
        default="http://localhost:8000/api/v1/ai",
        help="Base URL for AI endpoints",
    )

    followups_cmd = subparsers.add_parser("followups", help="Verify follow-up scheduler behavior")
    followups_cmd.add_argument(
        "--no-seed",
        action="store_true",
        help="Run follow-up checks without creating dummy records first",
    )

    security_cmd = subparsers.add_parser("security", help="Verify headers, CORS, and rate limits")
    security_cmd.add_argument(
        "--skip-rate-limit",
        action="store_true",
        help="Skip rate limit verification for faster checks",
    )

    scraper_cmd = subparsers.add_parser("scraper", help="Verify scraper flow against Mongo backend")
    scraper_cmd.add_argument("--keyword", default="Software Engineer", help="Search keyword")
    scraper_cmd.add_argument("--location", default="Remote", help="Search location")
    scraper_cmd.add_argument("--limit", type=int, default=1, help="Maximum jobs to scrape")

    ollama_cmd = subparsers.add_parser("ollama", help="Verify direct Ollama generation endpoint")
    ollama_cmd.add_argument(
        "--url",
        default="http://localhost:11434/api/generate",
        help="Ollama generation endpoint URL",
    )
    ollama_cmd.add_argument("--model", default="phi3", help="Model to query")
    ollama_cmd.add_argument("--prompt", default="Say hello", help="Prompt text")
    ollama_cmd.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds")

    return parser


async def _dispatch(args: argparse.Namespace) -> int:
    if args.command == "email":
        return await verify_email_configuration()

    if args.command == "followups":
        return await verify_followups(seed_dummy_data=not args.no_seed)

    if args.command == "telegram":
        return await verify_telegram_configuration()

    if args.command == "security":
        return verify_security(skip_rate_limit=args.skip_rate_limit)

    if args.command == "local-ai":
        return verify_local_ai_logic()

    if args.command == "imports":
        return verify_imports()

    if args.command == "error-handlers":
        return verify_error_handlers()

    if args.command == "ai-endpoints":
        return verify_ai_endpoints(base_url=args.base_url)

    if args.command == "scraper":
        return await verify_windows_scraper(
            keyword=args.keyword,
            location=args.location,
            limit=args.limit,
        )

    if args.command == "ollama":
        return verify_ollama_direct(
            url=args.url,
            model=args.model,
            prompt=args.prompt,
            timeout=args.timeout,
        )

    print(f"Unknown command: {args.command}")
    return 1


def _configure_windows_loop(command: str) -> None:
    if sys.platform != "win32":
        return

    # Scraper checks are validated against proactor behavior; other checks remain
    # on selector for compatibility with existing operational scripts.
    if command == "scraper":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    else:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    _configure_windows_loop(args.command)
    raise SystemExit(asyncio.run(_dispatch(args)))


if __name__ == "__main__":
    main()
