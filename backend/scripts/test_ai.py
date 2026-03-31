"""Unified AI service smoke-test CLI.

This script consolidates simple generation, structured resume, and structured
cover-letter checks that were previously split across multiple files.
"""

import argparse
import os
import sys


# Add backend to path.
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.services.ai_service import ai_service


def test_simple_generation() -> int:
    print("Testing Backend AI Service...")
    print(f"API Key Present: {bool(settings.GROQ_API_KEY)}")
    print(f"Model Fast: {settings.AI_MODEL_FAST}")

    try:
        response = ai_service.generate_text("Say 'Backend AI is working!'")
        print("\nResponse:")
        print(response)

        if "working" in response.lower() or "backend" in response.lower():
            print("\nSUCCESS: AI text generation is connected")
        else:
            print("\nWARNING: Response looks unexpected")

        print("\nTesting Resume Generation...")
        resume_response = ai_service.generate_resume_content("Software Engineer at Google")
        print(f"Resume Content Length: {len(resume_response)}")

        if len(resume_response) > 10:
            print("SUCCESS: Resume generation works")
            return 0

        print("ERROR: Resume generation output is unexpectedly short")
        return 1
    except Exception as exc:
        print(f"\nERROR: {exc}")
        return 1


def test_structured_resume() -> int:
    print("Testing Structured Resume Generation...")

    try:
        data = ai_service.generate_structured_resume(
            "Senior Python Developer with FastAPI experience."
        )
        print("\nStructure Validated")
        print(f"Keys: {list(data.keys())}")

        if "summary" in data and "skills" in data:
            print("\nSUCCESS: Structured resume generation works")
            return 0

        print("\nERROR: Structured resume response missing expected keys")
        return 1
    except Exception as exc:
        print(f"\nERROR: {exc}")
        return 1


def test_structured_cover_letter() -> int:
    print("Testing Structured Cover Letter Generation...")

    resume_summary = "Senior Python Developer with 5 years of experience in FastAPI and microservices."
    job_description = "We are looking for a backend engineer to build scalable APIs using Python and AWS."
    company_name = "TechCorp"

    try:
        data = ai_service.generate_structured_cover_letter(
            resume_summary,
            job_description,
            company_name,
        )
        print("\nStructure Validated")
        print(f"Keys: {list(data.keys())}")

        if "content" in data and "recipient" in data:
            print("\nSUCCESS: Structured cover-letter generation works")
            return 0

        print("\nERROR: Structured cover-letter response missing expected keys")
        return 1
    except Exception as exc:
        print(f"\nERROR: {exc}")
        return 1


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI service smoke-test commands")
    parser.add_argument(
        "command",
        choices=["all", "simple", "structured-resume", "structured-cover-letter"],
        nargs="?",
        default="all",
        help="Test command to run",
    )
    return parser


def main() -> None:
    args = _build_parser().parse_args()

    if args.command == "simple":
        raise SystemExit(test_simple_generation())

    if args.command == "structured-resume":
        raise SystemExit(test_structured_resume())

    if args.command == "structured-cover-letter":
        raise SystemExit(test_structured_cover_letter())

    results = [
        test_simple_generation(),
        test_structured_resume(),
        test_structured_cover_letter(),
    ]

    if all(result == 0 for result in results):
        print("\nALL TESTS PASSED")
        raise SystemExit(0)

    print("\nSOME TESTS FAILED")
    raise SystemExit(1)


if __name__ == "__main__":
    main()
