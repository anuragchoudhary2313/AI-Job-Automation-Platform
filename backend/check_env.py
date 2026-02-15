"""
Environment Configuration Checker

Run this script to verify your environment setup.
"""
import os
import sys
from pathlib import Path

def check_env_var(var_name, required=True, secret=False):
    """Check if environment variable is set."""
    value = os.getenv(var_name)
    if value:
        display_value = "***" if secret else value
        print(f"✅ {var_name}: {display_value}")
        return True
    else:
        status = "❌ REQUIRED" if required else "⚠️  OPTIONAL"
        print(f"{status} {var_name}: NOT SET")
        return not required

def main():
    print("=" * 60)
    print("Environment Configuration Check")
    print("=" * 60)
    print()
    
    # Load .env if exists
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        print(f"✅ .env file found: {env_file}")
        from dotenv import load_dotenv
        load_dotenv(env_file)
    else:
        print(f"⚠️  .env file not found: {env_file}")
        print("   Create one from .env.example")
    
    print()
    print("=" * 60)
    print("CRITICAL Settings")
    print("=" * 60)
    
    all_good = True
    all_good &= check_env_var("SECRET_KEY", required=True, secret=True)
    all_good &= check_env_var("POSTGRES_PASSWORD", required=True, secret=True)
    all_good &= check_env_var("POSTGRES_DB", required=True)
    
    print()
    print("=" * 60)
    print("Database Configuration")
    print("=" * 60)
    
    check_env_var("POSTGRES_SERVER", required=True)
    check_env_var("POSTGRES_USER", required=True)
    check_env_var("POSTGRES_PORT", required=False)
    
    print()
    print("=" * 60)
    print("Email Configuration")
    print("=" * 60)
    
    email_enabled = check_env_var("EMAIL_ENABLED", required=False)
    if email_enabled:
        check_env_var("EMAIL_HOST", required=True)
        check_env_var("EMAIL_PORT", required=True)
        check_env_var("EMAIL_USER", required=True)
        check_env_var("EMAIL_PASSWORD", required=True, secret=True)
    
    print()
    print("=" * 60)
    print("OpenAI Configuration")
    print("=" * 60)
    
    check_env_var("OPENAI_API_KEY", required=False, secret=True)
    
    print()
    print("=" * 60)
    print("Telegram Configuration (Optional)")
    print("=" * 60)
    
    telegram_enabled = check_env_var("TELEGRAM_ENABLED", required=False)
    if telegram_enabled:
        check_env_var("TELEGRAM_BOT_TOKEN", required=False, secret=True)
        check_env_var("TELEGRAM_CHAT_ID", required=False)
    
    print()
    print("=" * 60)
    print("Redis Configuration")
    print("=" * 60)
    
    check_env_var("REDIS_HOST", required=False)
    check_env_var("REDIS_PORT", required=False)
    
    print()
    print("=" * 60)
    print("Feature Flags")
    print("=" * 60)
    
    check_env_var("FEATURE_AI_RESUME", required=False)
    check_env_var("FEATURE_EMAIL_AUTOMATION", required=False)
    check_env_var("FEATURE_JOB_SCRAPING", required=False)
    
    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    
    if all_good:
        print("✅ All critical settings configured!")
    else:
        print("❌ Some critical settings missing. Check above.")
    
    print()
    print("Next steps:")
    print("1. Configure missing required variables in .env")
    print("2. Restart backend: uvicorn app.main:app --reload")
    print("3. Run manual tests from testing guides")
    print()

if __name__ == "__main__":
    main()
