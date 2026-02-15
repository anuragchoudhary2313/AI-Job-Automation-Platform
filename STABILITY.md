# Stability and Fault Tolerance Guide

Comprehensive stability improvements for production reliability.

## 🛡️ Features Implemented

### 1. Retry Logic with Exponential Backoff ✅

**Decorators:**
- `@retry_with_backoff` - Sync functions
- `@async_retry_with_backoff` - Async functions

**Configuration:**
```python
@retry_with_backoff(
    max_retries=3,
    initial_delay=1.0,
    max_delay=60.0,
    exponential_base=2.0,
    exceptions=(Exception,)
)
def unstable_function():
    # Will retry up to 3 times
    # Delays: 1s, 2s, 4s
    pass
```

**Backoff Pattern:**
- Attempt 1: Immediate
- Attempt 2: 1s delay
- Attempt 3: 2s delay
- Attempt 4: 4s delay
- Max delay: 60s

---

### 2. Circuit Breaker Pattern ✅

Prevents cascading failures by stopping requests to failing services.

**States:**
- **CLOSED**: Normal operation
- **OPEN**: Service failing, requests blocked
- **HALF_OPEN**: Testing recovery

**Usage:**
```python
from app.core.retry import CircuitBreaker

breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60,
    expected_exception=Exception
)

result = breaker.call(risky_function, arg1, arg2)
```

**Implemented For:**
- Email service (5 failures, 5min timeout)
- OpenAI API (3 failures, 3min timeout)

---

### 3. Email Retry Mechanism ✅

**Features:**
- 3 retry attempts
- Exponential backoff (2s, 4s, 8s)
- Circuit breaker protection
- Async support

**Example:**
```python
from app.services.email import email_service

# Automatically retries on failure
await email_service.send_email_async(
    to_email="user@example.com",
    subject="Application",
    body="...",
    attachments=["resume.pdf"]
)
```

**Handles:**
- SMTP connection errors
- Timeout errors
- Authentication failures
- Network issues

---

### 4. Resume Generation Retries ✅

**Features:**
- 3 retry attempts
- 2 minute timeout per attempt
- Circuit breaker (3 failures)
- Exponential backoff

**Example:**
```python
from app.services.resume import resume_service

# Automatically retries on OpenAI errors
resume = await resume_service.generate_resume(
    job_description="...",
    user_profile={...}
)
```

**Handles:**
- OpenAI API errors
- Rate limit errors
- Timeout errors
- Network issues

---

### 5. Scheduler Crash Recovery ✅

**Features:**
- Automatic restart on crash
- Health check every 5 minutes
- Job error isolation
- Graceful shutdown

**Monitoring:**
```python
# Health check runs automatically
# Restarts scheduler if not running
await health_check_scheduler()
```

**Job Protection:**
- Individual job failures don't crash scheduler
- Jobs have timeouts
- Errors are logged
- Failed jobs are retried next run

---

### 6. Background Task Timeouts ✅

**Timeout Decorator:**
```python
from app.core.retry import timeout

@timeout(30)  # 30 second timeout
async def long_running_task():
    # Will raise TimeoutError if exceeds 30s
    pass
```

**Configured Timeouts:**
- Job automation: 1 hour
- Single job processing: 10 minutes
- Resume generation: 2 minutes
- Cover letter: 1 minute
- Email sending: 30 seconds

---

## 📊 Fault Tolerance Matrix

| Service | Retries | Timeout | Circuit Breaker | Backoff |
|---------|---------|---------|-----------------|---------|
| Email | 3 | 30s | Yes (5/5min) | 2s→30s |
| Resume Gen | 3 | 120s | Yes (3/3min) | 2s→30s |
| Cover Letter | 2 | 60s | Yes (3/3min) | 1s→30s |
| Job Processing | - | 600s | No | - |
| Full Automation | - | 3600s | No | - |
| Scheduler | ∞ | - | No | 60s |

---

## 🔧 Configuration

### Environment Variables

```bash
# Retry settings (in code, can be env vars)
MAX_RETRIES=3
INITIAL_DELAY=1.0
MAX_DELAY=60.0

# Timeout settings
JOB_TIMEOUT=600
AUTOMATION_TIMEOUT=3600
RESUME_TIMEOUT=120

# Circuit breaker
EMAIL_FAILURE_THRESHOLD=5
EMAIL_RECOVERY_TIMEOUT=300
OPENAI_FAILURE_THRESHOLD=3
OPENAI_RECOVERY_TIMEOUT=180
```

---

## 🧪 Testing Fault Tolerance

### Test Retry Logic

```python
# Simulate failures
call_count = 0

@retry_with_backoff(max_retries=3)
def flaky_function():
    global call_count
    call_count += 1
    if call_count < 3:
        raise Exception("Temporary failure")
    return "Success"

result = flaky_function()
# Should succeed on 3rd attempt
```

### Test Circuit Breaker

```python
breaker = CircuitBreaker(failure_threshold=2)

# Cause failures
for i in range(3):
    try:
        breaker.call(failing_function)
    except:
        pass

# Circuit should be OPEN
try:
    breaker.call(any_function)
except CircuitBreakerError:
    print("Circuit is open!")
```

### Test Timeout

```python
@timeout(5)
async def slow_task():
    await asyncio.sleep(10)  # Will timeout

try:
    await slow_task()
except TimeoutError:
    print("Task timed out!")
```

---

## 📈 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0",
  "scheduler": {
    "running": true,
    "jobs": 2
  }
}
```

### Logs

All retries and failures are logged:

```
2024-01-01 12:00:00 - WARNING - send_email failed (attempt 1/3): Connection timeout. Retrying in 2.00s...
2024-01-01 12:00:02 - INFO - Email sent successfully to user@example.com
2024-01-01 12:05:00 - ERROR - Circuit breaker opened after 5 failures
2024-01-01 12:10:00 - INFO - Circuit breaker reset to CLOSED state
```

---

## 🚨 Error Handling Flow

### Email Sending

```
1. Attempt 1 → SMTP Error
2. Wait 2s
3. Attempt 2 → SMTP Error
4. Wait 4s
5. Attempt 3 → Success ✓
```

### Circuit Breaker

```
1. 5 consecutive failures
2. Circuit OPEN
3. All requests fail immediately
4. Wait 5 minutes
5. Circuit HALF_OPEN
6. Test request → Success
7. Circuit CLOSED ✓
```

### Scheduler Crash

```
1. Scheduler crashes
2. Health check detects (within 5 min)
3. Automatic restart
4. Jobs resume ✓
```

---

## 🎯 Best Practices

1. **Always use retry decorators** for external services
2. **Set appropriate timeouts** for all async operations
3. **Monitor circuit breaker state** in production
4. **Log all retries and failures** for debugging
5. **Test failure scenarios** before deployment
6. **Set realistic timeout values** based on SLAs
7. **Use circuit breakers** for critical services
8. **Implement health checks** for background services

---

## 🔍 Troubleshooting

### High Retry Rate

**Symptom:** Many retries in logs

**Solutions:**
- Increase initial delay
- Check service health
- Investigate root cause
- Adjust timeout values

### Circuit Breaker Always Open

**Symptom:** Circuit breaker constantly open

**Solutions:**
- Check external service status
- Increase failure threshold
- Increase recovery timeout
- Fix underlying issue

### Scheduler Not Running

**Symptom:** Jobs not executing

**Solutions:**
- Check `/health` endpoint
- Review scheduler logs
- Manually restart scheduler
- Check for deadlocks

---

## 📚 Additional Resources

- [APScheduler Documentation](https://apscheduler.readthedocs.io/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
