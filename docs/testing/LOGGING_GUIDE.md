# Logging and Error Visibility Guide

## Overview

The AI Job Automation Platform implements comprehensive logging and error handling for production readiness.

## Logging Features

### 1. Multiple Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARNING**: Warning messages for potential issues
- **ERROR**: Error messages for failures
- **CRITICAL**: Critical failures

### 2. Log Outputs

#### Console Logging
- All logs output to stdout
- Human-readable format in development
- Structured JSON in production

#### File Logging
- **`logs/app.log`**: All application logs
  - Rotating file handler (10MB max, 5 backups)
  - Contains all log levels
  
- **`logs/error.log`**: Error logs only
  - Rotating file handler (10MB max, 5 backups)
  - Contains ERROR and CRITICAL only
  
- **`logs/audit.log`** (Production only):
  - Daily rotating handler
  - Keeps 30 days of history
  - Audit trail for important actions

### 3. Structured Logging (Production)

Production logs are output as JSON for easy parsing:

```json
{
  "timestamp": "2026-02-08T17:30:00.000Z",
  "level": "ERROR",
  "logger": "app.api.endpoints.auth",
  "message": "Login failed for user",
  "module": "auth",
  "function": "login",
  "line": 86,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 123,
  "exception": "..."
}
```

### 4. Request Tracking

Every request gets a unique `request_id` for tracing:

```python
from app.core.logging import log_request

log_request(
    request_id="550e8400-e29b-41d4-a716-446655440000",
    method="POST",
    path="/api/v1/auth/login",
    user_id=123
)
```

### 5. Error Logging

Errors are logged with full context:

```python
from app.core.logging import log_error

try:
    # Some operation
    pass
except Exception as e:
    log_error(e, request_id=request_id, user_id=user_id)
```

### 6. Audit Logging

Important actions are logged to audit trail:

```python
from app.core.logging import log_audit

log_audit(
    action="resume_delete",
    user_id=123,
    resource="resume_456",
    details={"filename": "resume.pdf"}
)
```

---

## Error Handling

### 1. Production-Safe Error Responses

**Development**:
```json
{
  "error": "Internal server error",
  "message": "division by zero",
  "type": "ZeroDivisionError",
  "traceback": "...",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Production**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Validation Errors

Field-level validation errors:

```json
{
  "error": "Validation error",
  "message": "Request validation failed",
  "errors": [
    {
      "field": "body.email",
      "message": "value is not a valid email address",
      "type": "value_error.email"
    }
  ],
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 3. HTTP Exceptions

Consistent format for all HTTP errors:

```json
{
  "error": "Not found",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 4. Custom Exceptions

Use custom exceptions for specific errors:

```python
from app.core.exceptions import NotFoundError, AuthenticationError

# Raise custom exception
raise NotFoundError("Resume", resume_id)

# Automatically converted to HTTP response:
# {
#   "message": "Resume with identifier '123' not found",
#   "details": {}
# }
```

---

## Configuration

### Environment Variables

```bash
# Logging level
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# Debug mode (enables detailed errors)
DEBUG=false

# Environment
ENVIRONMENT=production  # development, staging, production
```

### Log Levels by Environment

| Environment | Default Level | Error Details |
|-------------|---------------|---------------|
| Development | DEBUG | Full traceback |
| Staging | INFO | Sanitized |
| Production | INFO | Sanitized |

---

## Usage Examples

### 1. Basic Logging

```python
from app.core.logging import get_logger

logger = get_logger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical message")
```

### 2. Logging with Context

```python
logger.info("User logged in", extra={
    "request_id": request_id,
    "user_id": user.id,
    "team_id": user.team_id
})
```

### 3. Exception Logging

```python
try:
    result = risky_operation()
except Exception as e:
    logger.error(f"Operation failed: {e}", exc_info=True)
    raise
```

### 4. Audit Trail

```python
from app.core.logging import log_audit

# User actions
log_audit("user_login", user_id=123, resource="auth", details={"ip": "1.2.3.4"})
log_audit("resume_upload", user_id=123, resource="resume_456", details={"filename": "resume.pdf"})
log_audit("job_apply", user_id=123, resource="job_789", details={"company": "Tech Corp"})
```

---

## Log Rotation

### File Rotation

- **Size-based**: Rotates when file reaches 10MB
- **Backup count**: Keeps 5 backup files
- **Naming**: `app.log`, `app.log.1`, `app.log.2`, etc.

### Daily Rotation (Audit Logs)

- **Time-based**: Rotates at midnight
- **Backup count**: Keeps 30 days
- **Naming**: `audit.log`, `audit.log.2026-02-07`, etc.

---

## Monitoring and Alerting

### Log Aggregation

For production, integrate with log aggregation services:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Datadog**
- **CloudWatch** (AWS)
- **Stackdriver** (Google Cloud)

### Example: Parsing JSON Logs

```bash
# Filter errors
cat logs/app.log | jq 'select(.level == "ERROR")'

# Filter by request ID
cat logs/app.log | jq 'select(.request_id == "550e8400-...")'

# Count errors by type
cat logs/app.log | jq -r 'select(.level == "ERROR") | .message' | sort | uniq -c
```

### Alerting Rules

Set up alerts for:

- **Error rate** > 10 errors/minute
- **Critical errors** (any occurrence)
- **Disk space** < 10% (for log files)
- **Failed logins** > 5 attempts/minute

---

## Best Practices

### 1. Use Appropriate Log Levels

```python
# ✅ Good
logger.debug(f"Processing {len(items)} items")  # Detailed info
logger.info("User registered successfully")     # Important events
logger.warning("API rate limit approaching")    # Potential issues
logger.error("Failed to send email", exc_info=True)  # Errors
logger.critical("Database connection lost")     # Critical failures

# ❌ Bad
logger.info("x = 5")  # Too verbose
logger.error("User logged in")  # Wrong level
```

### 2. Include Context

```python
# ✅ Good
logger.error(f"Failed to process resume {resume_id} for user {user_id}", exc_info=True)

# ❌ Bad
logger.error("Failed to process")
```

### 3. Don't Log Sensitive Data

```python
# ❌ Bad - Logs password
logger.info(f"User login: {email}, {password}")

# ✅ Good
logger.info(f"User login attempt: {email}")
```

### 4. Use Structured Logging

```python
# ✅ Good
logger.info("Payment processed", extra={
    "user_id": user_id,
    "amount": amount,
    "currency": "USD",
    "transaction_id": transaction_id
})

# ❌ Bad
logger.info(f"Payment processed: {user_id}, {amount}, USD, {transaction_id}")
```

---

## Troubleshooting

### Issue: Logs not appearing

**Solution**:
1. Check log level: `LOG_LEVEL=DEBUG`
2. Check logs directory exists: `mkdir logs`
3. Check file permissions
4. Restart application

### Issue: Log files growing too large

**Solution**:
1. Reduce log level in production: `LOG_LEVEL=INFO`
2. Adjust rotation settings in `logging.py`
3. Set up log cleanup cron job

### Issue: Can't find specific error

**Solution**:
1. Use request_id to trace request
2. Search error.log for ERROR level
3. Use grep or jq to filter logs

```bash
# Find by request ID
grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log

# Find errors in last hour
find logs/ -name "*.log" -mmin -60 -exec grep "ERROR" {} \;
```

---

## Production Checklist

- [ ] Set `LOG_LEVEL=INFO` or `WARNING`
- [ ] Set `DEBUG=false`
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure log aggregation service
- [ ] Set up log rotation
- [ ] Set up alerting rules
- [ ] Test error responses (no sensitive data)
- [ ] Monitor disk space for logs
- [ ] Set up log backup/archival
- [ ] Document incident response procedures

---

## Summary

✅ **Console + File Logging**: All logs to stdout and files  
✅ **Log Rotation**: Automatic rotation to prevent disk fill  
✅ **Structured Logging**: JSON format in production  
✅ **Request Tracking**: Unique request IDs  
✅ **Error Handling**: Production-safe error responses  
✅ **Audit Trail**: Important actions logged  
✅ **Context**: User ID, team ID, request ID tracking  

The logging system is production-ready and provides comprehensive visibility into application behavior and errors.
