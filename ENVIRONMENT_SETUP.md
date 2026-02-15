# Environment Setup Guide

## Quick Start Checklist

- [ ] PostgreSQL database running
- [ ] Redis running (for scheduler locks)
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] SMTP credentials (for email automation)
- [ ] OpenAI API key (for AI features)
- [ ] Telegram bot (optional, for notifications)
- [ ] Playwright browsers installed

---

## 1. Database Setup (PostgreSQL)

### Check if PostgreSQL is Running

```bash
# Windows
pg_isready

# Or check service
Get-Service postgresql*
```

### If Not Running

```bash
# Windows - Start PostgreSQL service
net start postgresql-x64-14  # Adjust version number

# Or use pgAdmin to start
```

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ai_job_automation;

# Create user (if needed)
CREATE USER job_automation_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_job_automation TO job_automation_user;

# Exit
\q
```

### Run Migrations

```bash
cd backend

# Run Alembic migrations
alembic upgrade head
```

---

## 2. Redis Setup

### Check if Redis is Running

```bash
# Windows
redis-cli ping
# Should return: PONG
```

### If Not Installed

**Windows**:
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Install Redis
3. Start service:
   ```bash
   net start Redis
   ```

**Or use Docker**:
```bash
docker run -d -p 6379:6379 redis:latest
```

---

## 3. Backend Environment Configuration

### Create `.env` File

```bash
cd backend
cp .env.example .env
```

### Edit `backend/.env`

```bash
# ============================================
# CRITICAL: Security Settings
# ============================================
SECRET_KEY=your-super-secret-key-change-this-in-production
POSTGRES_PASSWORD=your-database-password

# ============================================
# Database Configuration
# ============================================
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_DB=ai_job_automation

# ============================================
# Email Configuration (REQUIRED for email features)
# ============================================
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USE_SSL=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password  # NOT your regular password!
EMAIL_FROM_NAME=AI Job Automation Bot

# ============================================
# OpenAI Configuration (REQUIRED for AI features)
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key-here

# ============================================
# Telegram Configuration (OPTIONAL)
# ============================================
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# ============================================
# Feature Flags
# ============================================
FEATURE_AI_RESUME=true
FEATURE_AI_COVER_LETTER=true
FEATURE_EMAIL_AUTOMATION=true
FEATURE_JOB_SCRAPING=true

# ============================================
# Job Scraping
# ============================================
JOB_SCRAPING_ENABLED=true
PLAYWRIGHT_HEADLESS=true

# ============================================
# Redis Configuration
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# ============================================
# Environment
# ============================================
ENVIRONMENT=development
DEBUG=true
```

---

## 4. Frontend Environment Configuration

### Create `.env` File

```bash
cd frontend
```

### Edit `frontend/.env`

```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000
```

---

## 5. Gmail App Password Setup

### Why App Password?

Gmail requires app-specific passwords for third-party applications when 2FA is enabled.

### Steps:

1. **Go to Google Account**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (enable if not already)
3. **App passwords**: https://myaccount.google.com/apppasswords
4. **Select app**: Mail
5. **Select device**: Other (Custom name) → "AI Job Automation"
6. **Generate**
7. **Copy the 16-character password**
8. **Paste in `.env`**:
   ```bash
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # Remove spaces
   ```

### Test Email Configuration

```bash
# In backend directory
curl http://localhost:8000/api/v1/email/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 6. OpenAI API Key Setup

### Get API Key:

1. **Go to**: https://platform.openai.com/api-keys
2. **Create new secret key**
3. **Copy the key** (starts with `sk-`)
4. **Add to `.env`**:
   ```bash
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   ```

### Verify:

```bash
# Check if key is loaded
python -c "from app.core.config import settings; print('OpenAI Key:', 'SET' if settings.OPENAI_API_KEY else 'NOT SET')"
```

### Check Credits:

Visit: https://platform.openai.com/usage

---

## 7. Telegram Bot Setup (Optional)

### Create Bot:

1. **Open Telegram** and search for `@BotFather`
2. **Send**: `/newbot`
3. **Follow prompts** to name your bot
4. **Copy the token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Get Chat ID:

1. **Start chat** with your bot
2. **Send any message**
3. **Visit**: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. **Find `chat.id`** in the response
5. **Copy the chat ID**

### Add to `.env`:

```bash
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
```

### Test:

```bash
curl -X POST http://localhost:8000/api/v1/telegram/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 8. Playwright Browser Installation

### Install Playwright:

```bash
cd backend

# Install Playwright
pip install playwright

# Install Chromium browser
playwright install chromium

# Verify
playwright --version
```

### Test:

```python
python -c "from playwright.sync_api import sync_playwright; print('Playwright OK')"
```

---

## 9. Verify All Services

### Backend Health Check:

```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "environment": "development",
  "scheduler": {
    "running": true,
    "jobs": 4
  }
}
```

### Frontend:

Open browser to: `http://localhost:5173`

Should see the landing page.

---

## 10. Quick Test Workflow

### 1. Register User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "full_name": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPassword123!"
```

**Save the `access_token` from response.**

### 3. Test Features

```bash
# Set token
TOKEN="your-access-token-here"

# Test email configuration
curl http://localhost:8000/api/v1/email/test \
  -H "Authorization: Bearer $TOKEN"

# Test job scraping
curl "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Test scheduler status
curl http://localhost:8000/api/v1/scheduler/status \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### PostgreSQL Connection Error

**Error**: `could not connect to server`

**Solution**:
1. Check PostgreSQL is running: `Get-Service postgresql*`
2. Verify connection string in `.env`
3. Check firewall settings

### Redis Connection Error

**Error**: `Error connecting to Redis`

**Solution**:
1. Check Redis is running: `redis-cli ping`
2. Verify `REDIS_HOST` and `REDIS_PORT` in `.env`
3. Start Redis: `net start Redis`

### Email Send Error

**Error**: `SMTP authentication failed`

**Solution**:
1. Use Gmail App Password, not regular password
2. Enable 2FA on Google Account
3. Generate new app password
4. Remove spaces from app password

### OpenAI API Error

**Error**: `Invalid API key`

**Solution**:
1. Verify key starts with `sk-`
2. Check for extra spaces
3. Ensure key is active on OpenAI dashboard
4. Check billing/credits

### Playwright Error

**Error**: `Executable doesn't exist`

**Solution**:
```bash
playwright install chromium --force
```

---

## Environment Variables Reference

### Required for Core Features

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SECRET_KEY` | ✅ | - | JWT signing |
| `POSTGRES_PASSWORD` | ✅ | - | Database auth |
| `POSTGRES_DB` | ✅ | `ai_job_automation` | Database name |

### Required for Email Features

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `EMAIL_ENABLED` | ✅ | `false` | Enable email |
| `EMAIL_HOST` | ✅ | - | SMTP server |
| `EMAIL_PORT` | ✅ | `587` | SMTP port |
| `EMAIL_USER` | ✅ | - | Email address |
| `EMAIL_PASSWORD` | ✅ | - | App password |

### Required for AI Features

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | ✅ | - | OpenAI API access |
| `FEATURE_AI_RESUME` | ⚠️ | `true` | Enable AI resume |

### Optional

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `TELEGRAM_ENABLED` | ❌ | `false` | Enable Telegram |
| `TELEGRAM_BOT_TOKEN` | ❌ | - | Bot token |
| `TELEGRAM_CHAT_ID` | ❌ | - | Chat ID |

---

## Next Steps

After environment setup:

1. ✅ **Restart backend** to load new environment variables
2. ✅ **Test each feature** using the testing guides
3. ✅ **Open browser** to `http://localhost:5173`
4. ✅ **Follow** `MANUAL_TESTING_GUIDE.md`

---

## Production Deployment Notes

### Security

- ✅ Change `SECRET_KEY` to strong random value
- ✅ Use strong `POSTGRES_PASSWORD`
- ✅ Set `DEBUG=false`
- ✅ Set `ENVIRONMENT=production`
- ✅ Use environment-specific secrets manager
- ✅ Enable HTTPS
- ✅ Configure CORS properly

### Services

- ✅ Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- ✅ Use managed Redis (AWS ElastiCache, Redis Cloud)
- ✅ Use professional email service (SendGrid, Mailgun)
- ✅ Set up monitoring and logging
- ✅ Configure backup and disaster recovery

---

**Setup Complete!** 🎉

Your environment is now ready for manual testing.
