# Manual Testing Guide: Job Scraping & Browser Automation

## Prerequisites

✅ **Backend Running**: `http://localhost:8000`  
✅ **Frontend Running**: `http://localhost:5173`  
✅ **Playwright Installed**: `playwright install chromium`  
✅ **User Logged In**: Valid authentication token  
⚠️ **Feature Flag**: `FEATURE_JOB_SCRAPING=true` (default)

---

## Environment Setup

### Install Playwright Browsers

```bash
# In backend directory
cd backend

# Install Playwright
pip install playwright

# Install Chromium browser
playwright install chromium

# Verify installation
playwright --version
```

### Configuration

Edit `backend/.env`:

```bash
# Job Scraping Settings
FEATURE_JOB_SCRAPING=true
JOB_SCRAPING_ENABLED=true
PLAYWRIGHT_HEADLESS=true  # Set to false for debugging

# Optional: Telegram notifications
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Verify Playwright Installation

```bash
# Test Playwright
python -c "from playwright.sync_api import sync_playwright; print('Playwright OK')"

# Should print: Playwright OK
```

---

## Backend Implementation Overview

### Components

1. **BrowserManager** (`app/automation/browser.py`)
   - Launches Playwright Chromium browser
   - Anti-detection measures (stealth mode)
   - Headless/headed mode support

2. **LinkedInScraper** (`app/automation/scrapers/linkedin.py`)
   - Scrapes LinkedIn job listings
   - Cookie-based session management
   - Public job search scraping

3. **JobScraperService** (`app/services/job_scraper.py`)
   - Orchestrates scraping flow
   - Duplicate detection
   - Database storage
   - Telegram notifications

### Current Limitations

⚠️ **Auto-Apply Not Implemented**: The auto-apply logic is not yet built
⚠️ **LinkedIn Only**: Only LinkedIn scraper exists
⚠️ **Public Pages**: Relies on public job search (limited data)
⚠️ **No Login**: LinkedIn login not implemented (CAPTCHA issues)

---

## Test 1: Verify Playwright Installation

### Steps:
1. Open terminal in backend directory
2. Run verification script:

```bash
python -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('https://example.com')
    print('Title:', page.title())
    browser.close()
"
```

### Expected Results:
- ✅ Script runs without errors
- ✅ Prints: `Title: Example Domain`
- ✅ Browser launches and closes

### Common Issues:
- ❌ "playwright not found" → Run `pip install playwright`
- ❌ "Executable doesn't exist" → Run `playwright install chromium`
- ❌ "$HOME not set" → Set HOME environment variable

---

## Test 2: Manual Job Scraping via API

### Steps:

```bash
# Get access token first
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPassword123!" \
  | jq -r '.access_token')

# Scrape jobs
curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=software+engineer&location=San+Francisco&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Expected Response:
```json
{
  "jobs": [
    {
      "id": 1,
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "link": "https://www.linkedin.com/jobs/view/...",
      "source": "linkedin",
      "status": "new",
      "created_at": "2026-02-08T..."
    }
  ],
  "count": 5
}
```

### Verification:
```bash
# Check backend logs
# Should see:
# "Starting scrape for software engineer in San Francisco"
# "Scraped 5 jobs from LinkedIn"
# "Scraping completed. Found 5 jobs, 5 new."
```

---

## Test 3: Job Scraping via UI

### Steps:
1. Login to `http://localhost:5173`
2. Navigate to `/jobs` page
3. Fill in Job Scraper form:
   - **Keyword**: `Python Developer`
   - **Location**: `Remote`
   - **Limit**: `10`
4. Click "Scrape Jobs"

### Expected Results:
- ✅ Button shows loading state ("Scraping...")
- ✅ Button disabled during scraping
- ✅ Scraping takes 10-30 seconds
- ✅ Success toast: "Found X jobs!"
- ✅ Jobs appear in table below
- ✅ Each job shows:
  - Title
  - Company
  - Location
  - Source (LinkedIn)
  - Link to job posting
  - Status (New/Applied/Rejected)

### Verification:
```javascript
// Browser console - check network tab
// GET /api/v1/jobs/scrape?keyword=...&location=...&limit=10
// Status: 200 OK
```

---

## Test 4: Duplicate Detection

### Steps:
1. Scrape jobs with same keyword/location
2. Wait for completion
3. Scrape again with same parameters

### Expected Results:
- ✅ First scrape: "Found 10 jobs, 10 new"
- ✅ Second scrape: "Found 10 jobs, 0 new"
- ✅ No duplicate entries in database
- ✅ Job count remains same

### Verification:
```bash
# Check database
# SELECT COUNT(*) FROM scraped_jobs WHERE title = 'Python Developer';
# Should not increase on second scrape
```

---

## Test 5: Telegram Notifications

If Telegram is configured:

### Steps:
1. Configure Telegram in `.env`
2. Scrape jobs
3. Check Telegram

### Expected Results:
- ✅ Notification for each new job:
  ```
  🎯 New Job Found
  Role: Senior Python Developer
  Company: Tech Corp
  Location: Remote
  [Apply Now] (link)
  ```
- ✅ Notification on scraping failure

---

## Test 6: Headless vs Headed Mode

### Test Headless (Production Mode)

```bash
# In backend/.env
PLAYWRIGHT_HEADLESS=true
```

**Expected**: Browser runs invisibly, faster

### Test Headed (Debug Mode)

```bash
# In backend/.env
PLAYWRIGHT_HEADLESS=false
```

**Expected**: Browser window opens visibly, can see scraping in action

---

## Test 7: Error Handling - Playwright Not Installed

### Steps:
1. Uninstall Playwright browsers:
   ```bash
   rm -rf ~/.cache/ms-playwright
   ```
2. Try to scrape jobs

### Expected Results:
- ❌ Error toast: "Browser automation not available"
- ❌ HTTP 500 error
- ✅ User-friendly error message

### Backend Logs:
```bash
# Should show:
# "Failed to launch browser: Executable doesn't exist"
```

---

## Test 8: Error Handling - Network Error

### Steps:
1. Disconnect from internet
2. Try to scrape jobs

### Expected Results:
- ❌ Error toast: "Failed to load job listings"
- ✅ Graceful error handling
- ✅ No application crash

---

## Test 9: Error Handling - Invalid Selectors

LinkedIn frequently changes their DOM structure.

### Steps:
1. Scrape jobs
2. If selectors are outdated, scraping may fail

### Expected Results:
- ⚠️ May return 0 jobs if selectors broken
- ✅ No crash
- ✅ Error logged

### Fix:
Update selectors in `linkedin.py` based on current LinkedIn DOM

---

## Test 10: Performance Testing

### Scraping Time Benchmarks

| Jobs | Expected Time | Acceptable Range |
|------|---------------|------------------|
| 5 jobs | 10-15 seconds | 5-20 seconds |
| 10 jobs | 15-25 seconds | 10-30 seconds |
| 25 jobs | 30-45 seconds | 20-60 seconds |

### Monitor:
```javascript
// Browser console
console.time('job-scraping');
// Click scrape
// Wait for completion
console.timeEnd('job-scraping');
```

---

## Auto-Apply Logic (NOT YET IMPLEMENTED)

### Current Status: ⚠️ **NOT IMPLEMENTED**

The auto-apply feature is planned but not yet built. Here's what needs to be implemented:

### Required Components:

1. **Auto-Apply Service** (needs creation)
   ```python
   # app/services/auto_apply.py
   class AutoApplyService:
       async def apply_to_job(self, job_id: int, resume_id: int):
           # Navigate to job link
           # Click "Easy Apply" button
           # Fill in application form
           # Upload resume
           # Submit application
   ```

2. **Application Form Handler** (needs creation)
   ```python
   # app/automation/form_filler.py
   class FormFiller:
       async def fill_linkedin_easy_apply(self, page, user_data):
           # Fill name, email, phone
           # Upload resume
           # Answer screening questions
           # Submit
   ```

3. **Screening Question AI** (needs creation)
   ```python
   # Use OpenAI to answer screening questions
   # "Years of experience with Python?"
   # "Are you authorized to work in US?"
   ```

### Testing Auto-Apply (When Implemented):

1. **Test Easy Apply**:
   - Find job with "Easy Apply" button
   - Click auto-apply
   - Verify form filled correctly
   - Verify application submitted

2. **Test Resume Upload**:
   - Verify correct resume attached
   - Verify file uploads successfully

3. **Test Screening Questions**:
   - Answer yes/no questions
   - Answer text questions with AI
   - Handle dropdowns and checkboxes

4. **Test Application Tracking**:
   - Mark job as "Applied"
   - Store application date
   - Track application status

---

## Debugging Tips

### View Browser in Action

```bash
# Set headless to false
PLAYWRIGHT_HEADLESS=false

# Run scraping
# Browser window will open and you can see what's happening
```

### Enable Debug Logging

```python
# In backend/app/automation/browser.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Inspect Page Elements

```python
# In linkedin.py, add:
await page.screenshot(path="debug_screenshot.png")
html = await page.content()
print(html)  # See full HTML
```

### Check Cookies

```python
# In linkedin.py, add:
cookies = await page.context.cookies()
print("Cookies:", cookies)
```

---

## Known Issues & Limitations

### 1. LinkedIn Anti-Bot Detection
- **Issue**: LinkedIn may detect automation
- **Solution**: Use stealth mode, rotate user agents, add delays

### 2. CAPTCHA Challenges
- **Issue**: LinkedIn shows CAPTCHA on login
- **Solution**: Use cookie-based sessions, avoid login

### 3. Rate Limiting
- **Issue**: Too many requests → IP ban
- **Solution**: Add delays, use proxies, limit scraping frequency

### 4. DOM Changes
- **Issue**: LinkedIn changes selectors frequently
- **Solution**: Regular selector updates, use robust selectors

### 5. Limited Data
- **Issue**: Public pages show limited job details
- **Solution**: Login with cookies for full access

---

## Troubleshooting

### Issue: "Executable doesn't exist"
**Solution**:
```bash
playwright install chromium
# or
python -m playwright install chromium
```

### Issue: "$HOME environment variable is not set"
**Solution**:
```bash
# Windows
set HOME=%USERPROFILE%

# Linux/Mac
export HOME=~
```

### Issue: "Timeout waiting for selector"
**Solution**:
1. Check if LinkedIn changed DOM structure
2. Update selectors in `linkedin.py`
3. Increase timeout value
4. Check if page loaded correctly

### Issue: "0 jobs scraped"
**Solution**:
1. Check if selectors are correct
2. Verify LinkedIn page structure
3. Check if keyword/location valid
4. Try in headed mode to see what's happening

### Issue: Browser crashes
**Solution**:
1. Update Playwright: `pip install -U playwright`
2. Reinstall browsers: `playwright install --force`
3. Check system resources (RAM, CPU)
4. Reduce concurrent scraping

---

## Production Recommendations

### 1. Use Proxies
```python
# In browser.py
self.browser = await self.playwright.chromium.launch(
    proxy={
        "server": "http://proxy-server:port",
        "username": "user",
        "password": "pass"
    }
)
```

### 2. Rotate User Agents
```python
import random
user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
]
user_agent = random.choice(user_agents)
```

### 3. Add Random Delays
```python
import random
await asyncio.sleep(random.uniform(2, 5))  # 2-5 second delay
```

### 4. Implement Retry Logic
```python
max_retries = 3
for attempt in range(max_retries):
    try:
        await scrape_jobs()
        break
    except Exception as e:
        if attempt == max_retries - 1:
            raise
        await asyncio.sleep(5)
```

### 5. Use Cookie Sessions
- Save cookies after manual login
- Reuse cookies to avoid repeated logins
- Refresh cookies periodically

### 6. Monitor & Alert
- Track scraping success rate
- Alert on failures
- Monitor for IP bans

---

## Testing Checklist

- [ ] Playwright installed
- [ ] Chromium browser installed
- [ ] Feature flag enabled
- [ ] Can scrape jobs via API
- [ ] Can scrape jobs via UI
- [ ] Jobs appear in table
- [ ] Job links work
- [ ] Duplicate detection works
- [ ] Telegram notifications work (if enabled)
- [ ] Headless mode works
- [ ] Headed mode works (debugging)
- [ ] Error handling for missing Playwright
- [ ] Error handling for network errors
- [ ] Error handling for invalid selectors
- [ ] Scraping time acceptable (<30s for 10 jobs)
- [ ] No console errors
- [ ] No backend crashes

---

## Success Criteria

✅ Scraping completes within 30 seconds  
✅ Jobs stored in database correctly  
✅ No duplicate jobs created  
✅ Telegram notifications sent (if enabled)  
✅ Error handling is graceful  
✅ Browser automation is stealthy  

---

## Future Enhancements

1. **Auto-Apply Feature**:
   - Implement form filling
   - Handle screening questions with AI
   - Track application status

2. **Multiple Job Boards**:
   - Indeed scraper
   - Glassdoor scraper
   - AngelList scraper

3. **Advanced Filtering**:
   - Salary range
   - Experience level
   - Remote/hybrid/onsite
   - Company size

4. **Smart Matching**:
   - AI-powered job matching
   - Resume-job compatibility score
   - Personalized recommendations

---

**Test Date**: ___________  
**Tester**: ___________  
**Playwright Version**: ___________  
**Result**: ⬜ PASS / ⬜ FAIL  
**Jobs Scraped**: ___________  
**Scraping Time**: ___________  
**Notes**: ___________
