
import sys
import importlib
import os

print("Verifying Python Dependencies...")

dependencies = [
    "fastapi",
    "uvicorn",
    "pydantic",
    "jose",  # python-jose
    "passlib",
    "sqlalchemy",
    "alembic",
    "apscheduler",
    "websockets",
    "openai",
    "selenium",
    "bs4",  # beautifulsoup4
    "lxml",
    "jinja2",
    "telegram",  # python-telegram-bot
    "pytest",
    "httpx",
    "loguru",
    "rich",
    "aiosqlite"
]

missing = []
for dep in dependencies:
    try:
        importlib.import_module(dep)
        print(f"✔ {dep} installed")
    except ImportError:
        print(f"❌ {dep} MISSING")
        missing.append(dep)

if missing:
    print(f"\nMissing dependencies: {', '.join(missing)}")
    sys.exit(1)
else:
    print("\nAll backend dependencies verified!")
    sys.exit(0)
