# Environment & Configuration Audit Report

## Executive Summary

**Audit Date**: 2026-02-08  
**Configuration File**: `backend/app/core/config.py`  
**Total Variables**: 45+  
**Status**: ✅ Well-structured with safe defaults

## Configuration Categories

### 1. Security Settings ✅

| Variable | Default | Required | Status | Notes |
|----------|---------|----------|--------|-------|
| `SECRET_KEY` | None | ✅ Yes | ⚠️ **MUST SET** | Used for JWT signing |
| `ALGORITHM` | HS256 | No | ✅ Good | Standard JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | No | ✅ Good | 30-minute expiry |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | No | ✅ Good | 7-day expiry |
| `ENABLE_CSRF_PROTECTION` | true | No | ✅ Good | CSRF enabled by default |
| `CSRF_SECRET_KEY` | None | No | ⚠️ Recommended | Separate CSRF key |
| `SESSION_COOKIE_SECURE` | true | No | ✅ Good | HTTPS only |
| `SESSION_COOKIE_HTTPONLY` | true | No | ✅ Good | No JS access |
| `SESSION_COOKIE_SAMESITE` | lax | No | ✅ Good | CSRF protection |

**Recommendations**:
- ✅ Good: Secure defaults for production
- ⚠️ **CRITICAL**: Must set `SECRET_KEY` before deployment
- ✅ Token expiry times are reasonable

---

### 2. Database Configuration ✅

| Variable | Default | Required | Status | Notes |
|----------|---------|----------|--------|-------|
| `POSTGRES_SERVER` | localhost | No | ✅ Good | Default for dev |
| `POSTGRES_USER` | postgres | No | ✅ Good | Standard user |
| `POSTGRES_PASSWORD` | postgres | No | ⚠️ **CHANGE** | Weak default |
| `POSTGRES_DB` | ai_job_automation | No | ✅ Good | Clear name |
| `DATABASE_URL` | None | No | ✅ Good | Override option |

**Connection String**:
```python
postgresql+asyncpg://{user}:{password}@{server}/{database}
```

**Recommendations**:
- ⚠️ **CRITICAL**: Change `POSTGRES_PASSWORD` in production
- ✅ `DATABASE_URL` override is good for cloud deployments
- ✅ Uses async PostgreSQL driver (asyncpg)

---

### 3. Email Configuration ⚠️

| Variable | Default | Required | Status | Notes |
|----------|---------|----------|--------|-------|
| `EMAIL_ENABLED` | true | No | ⚠️ Warning | Enabled but no credentials |
| `EMAIL_HOST` | smtp.gmail.com | No | ✅ Good | Gmail default |
| `EMAIL_PORT` | 465 | No | ✅ Good | SSL port |
| `EMAIL_USE_SSL` | true | No | ✅ Good | Secure connection |
| `EMAIL_USER` | None | ⚠️ If enabled | ⚠️ **MUST SET** | Email address |
| `EMAIL_PASSWORD` | None | ⚠️ If enabled | ⚠️ **MUST SET** | App password |
| `EMAIL_FROM_NAME` | AI Job Automation Bot | No | ✅ Good | Friendly name |

**Deprecated Variables** (kept for compatibility):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAILS_FROM_EMAIL`

**Recommendations**:
- ⚠️ Set `EMAIL_ENABLED=false` if not using email features
- ⚠️ Use Gmail App Passwords, not regular password
- ✅ Consider using environment-specific SMTP servers

---

### 4. Telegram Notifications ✅

| Variable | Default | Required | Status | Notes |
|----------|---------|----------|--------|-------|
| `TELEGRAM_ENABLED` | true | No | ⚠️ Warning | Enabled but no token |
| `TELEGRAM_BOT_TOKEN` | None | ⚠️ If enabled | ⚠️ **MUST SET** | Bot token |
| `TELEGRAM_CHAT_ID` | None | ⚠️ If enabled | ⚠️ **MUST SET** | Chat ID |

**Recommendations**:
- ⚠️ Set `TELEGRAM_ENABLED=false` if not using Telegram
- ✅ Good: Graceful degradation if credentials missing

---

### 5. AI Services Configuration ⚠️

| Variable | Default | Required | Status | Notes |
|----------|---------|----------|--------|-------|
| `OPENAI_API_KEY` | None | ⚠️ For AI features | ⚠️ **MUST SET** | Required for resume generation |
| `USE_LOCAL_AI` | false | No | ✅ Good | OpenAI by default |
| `OLLAMA_BASE_URL` | http://localhost:11434 | No | ✅ Good | Local AI fallback |
| `OLLAMA_DEFAULT_MODEL` | llama3 | No | ✅ Good | Good model choice |
| `OLLAMA_FALLBACK_MODEL` | tinyllama | No | ✅ Good | Lightweight fallback |

**Recommendations**:
- ⚠️ **CRITICAL**: Set `OPENAI_API_KEY` for AI resume generation
- ✅ Good: Local AI fallback option available
- ✅ Ollama integration provides cost-effective alternative

---

### 6. Feature Flags ✅

| Feature | Default | Status | Notes |
|---------|---------|--------|-------|
| `FEATURE_AI_RESUME` | true | ⚠️ Warning | Requires OpenAI key |
| `FEATURE_AI_COVER_LETTER` | true | ⚠️ Warning | Requires OpenAI key |
| `FEATURE_EMAIL_AUTOMATION` | true | ⚠️ Warning | Requires SMTP config |
| `FEATURE_JOB_SCRAPING` | false | ✅ Good | Disabled by default |
| `FEATURE_AUTO_APPLY` | false | ✅ Good | Disabled by default |
| `FEATURE_TEAMS` | true | ✅ Good | Multi-user support |
| `FEATURE_ADMIN_PANEL` | true | ✅ Good | Admin features |

**Feature Flag System**:
- ✅ Centralized in `app/core/features.py`
- ✅ Case-insensitive matching
- ✅ Safe default (false) if flag doesn't exist
- ✅ HTTP 403 enforcement via `features.require()`

**Recommendations**:
- ⚠️ Disable AI features if no OpenAI key: `FEATURE_AI_RESUME=false`
- ⚠️ Disable email features if no SMTP: `FEATURE_EMAIL_AUTOMATION=false`
- ✅ Good: Dangerous features (scraping, auto-apply) disabled by default

---

### 7. Job Scraping & Automation ✅

| Variable | Default | Required | Status | Notes |
|----------|---------|----------|--------|-------|
| `JOB_SCRAPING_ENABLED` | false | No | ✅ Good | Disabled by default |
| `AUTO_APPLY_ENABLED` | false | No | ✅ Good | Disabled by default |
| `PLAYWRIGHT_HEADLESS` | true | No | ✅ Good | Headless browser |
| `JOB_APPLY_DELAY_SECONDS` | 5 | No | ✅ Good | Rate limiting |
| `JOB_MAX_APPLIES_PER_DAY` | 5 | No | ✅ Good | Conservative limit |

**Recommendations**:
- ✅ Excellent: Disabled by default for safety
- ✅ Good rate limiting to avoid detection
- ⚠️ Requires Playwright installation: `playwright install`

---

### 8. Scheduler Configuration ✅

| Variable | Default | Required | Status | Notes |
|----------|---------|----------|--------|-------|
| `SCHEDULER_ENABLED` | true | No | ✅ Good | Background tasks enabled |
| `SCHEDULER_TIMEZONE` | Asia/Kolkata | No | ✅ Good | Timezone-aware |

**Scheduled Jobs**:
- Job scraping: Every 6 hours
- Job automation: Every 1 hour
- Follow-up checks: Daily at 10 AM
- Log cleanup: Daily at 2 AM

**Recommendations**:
- ✅ Execution locks implemented (prevents concurrent runs)
- ✅ Timeout handling added
- ✅ Comprehensive logging

---

### 9. CORS & Security Headers ✅

| Variable | Default | Status | Notes |
|----------|---------|--------|-------|
| `BACKEND_CORS_ORIGINS` | localhost:3000, 5173, 8080 | ✅ Good | Dev origins |
| `ALLOWED_HOSTS` | * | ⚠️ Warning | Too permissive |

**Recommendations**:
- ⚠️ **PRODUCTION**: Set specific `ALLOWED_HOSTS`
- ✅ Good: Multiple dev ports for flexibility

---

### 10. Rate Limiting ✅

| Variable | Default | Status | Notes |
|----------|---------|--------|-------|
| `RATE_LIMIT_ENABLED` | true | ✅ Good | Protection enabled |
| `RATE_LIMIT_CALLS` | 100 | ✅ Good | 100 calls per period |
| `RATE_LIMIT_PERIOD` | 60 | ✅ Good | 60 seconds |

**Recommendations**:
- ✅ Good: Reasonable limits for API protection
- ✅ Enabled by default

---

### 11. File Uploads ✅

| Variable | Default | Status | Notes |
|----------|---------|--------|-------|
| `MAX_UPLOAD_SIZE` | 10MB | ✅ Good | Reasonable limit |
| `UPLOAD_DIR` | ./uploads | ✅ Good | Local directory |

**Recommendations**:
- ✅ 10MB is good for PDF resumes
- ⚠️ **PRODUCTION**: Use cloud storage (S3, Azure Blob)

---

### 12. Redis Cache ⚠️

| Variable | Default | Status | Notes |
|----------|---------|--------|-------|
| `REDIS_URL` | redis://localhost:6379/0 | ⚠️ Optional | Not required |
| `CACHE_ENABLED` | true | ⚠️ Warning | Enabled but Redis may not be running |
| `CACHE_DEFAULT_EXPIRE` | 300 | ✅ Good | 5-minute expiry |

**Recommendations**:
- ⚠️ Set `CACHE_ENABLED=false` if Redis not installed
- ✅ Application should gracefully degrade without Redis

---

### 13. Environment & Debug ✅

| Variable | Default | Status | Notes |
|----------|---------|--------|-------|
| `ENVIRONMENT` | development | ✅ Good | Safe default |
| `DEBUG` | false | ✅ Good | Debug off by default |
| `PROJECT_NAME` | AI Job Automation Platform | ✅ Good | Clear name |
| `API_V1_STR` | /api/v1 | ✅ Good | Versioned API |

---

## Critical Issues Summary

### 🔴 MUST FIX Before Production

1. **SECRET_KEY**: Generate strong random key
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **POSTGRES_PASSWORD**: Change from default `postgres`

3. **ALLOWED_HOSTS**: Set specific domains in production

### ⚠️ SHOULD FIX Before Deployment

4. **EMAIL Configuration**: Set credentials or disable
5. **TELEGRAM Configuration**: Set credentials or disable
6. **OPENAI_API_KEY**: Set for AI features or disable features
7. **REDIS**: Install Redis or disable caching

### ✅ GOOD Defaults

8. **Security**: Strong defaults (HTTPS, CSRF, secure cookies)
9. **Feature Flags**: Dangerous features disabled by default
10. **Rate Limiting**: Enabled with reasonable limits
11. **Scheduler**: Execution locks and timeouts implemented

---

## Environment Setup Checklist

### Minimal Setup (No External Services)

```env
SECRET_KEY=generate-random-key-here
POSTGRES_PASSWORD=strong-password-here
EMAIL_ENABLED=false
TELEGRAM_ENABLED=false
FEATURE_AI_RESUME=false
FEATURE_AI_COVER_LETTER=false
FEATURE_EMAIL_AUTOMATION=false
CACHE_ENABLED=false
```

### Full Setup (All Features)

```env
SECRET_KEY=generate-random-key-here
POSTGRES_PASSWORD=strong-password-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
OPENAI_API_KEY=sk-your-api-key
```

---

## Frontend Environment Variables

**Location**: `frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1
```

**Production**:
```env
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_WS_URL=wss://api.yourdomain.com/api/v1
```

---

## Validation Script

Create `backend/scripts/validate_env.py`:

```python
from app.core.config import settings

def validate_environment():
    errors = []
    warnings = []
    
    # Critical checks
    if not settings.SECRET_KEY or settings.SECRET_KEY == "your-secret-key":
        errors.append("SECRET_KEY must be set to a random value")
    
    if settings.POSTGRES_PASSWORD == "postgres":
        warnings.append("POSTGRES_PASSWORD should be changed from default")
    
    # Feature-specific checks
    if settings.FEATURE_AI_RESUME and not settings.OPENAI_API_KEY:
        warnings.append("FEATURE_AI_RESUME enabled but OPENAI_API_KEY not set")
    
    if settings.EMAIL_ENABLED and not settings.EMAIL_USER:
        warnings.append("EMAIL_ENABLED but EMAIL_USER not set")
    
    # Print results
    if errors:
        print("❌ ERRORS:")
        for error in errors:
            print(f"  - {error}")
    
    if warnings:
        print("⚠️  WARNINGS:")
        for warning in warnings:
            print(f"  - {warning}")
    
    if not errors and not warnings:
        print("✅ Environment configuration looks good!")
    
    return len(errors) == 0

if __name__ == "__main__":
    validate_environment()
```

---

## Audit Status: ✅ PASS (with warnings)

**Overall Assessment**: Configuration is well-structured with safe defaults. Critical security settings are properly configured. External service integrations have graceful degradation.

**Action Required**: Set production secrets and configure external services before deployment.
