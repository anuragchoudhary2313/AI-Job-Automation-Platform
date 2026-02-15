# Security Hardening Guide

Complete security implementation for production deployment.

## 🔒 Security Features Implemented

### 1. JWT with Refresh Tokens ✅

**Access Tokens:**
- Short-lived (30 minutes default)
- Used for API authentication
- Stored in memory (not localStorage)

**Refresh Tokens:**
- Long-lived (7 days default)
- HTTP-only cookies
- Used to get new access tokens
- Secure, SameSite=lax

**Usage:**
```python
# Login returns both tokens
POST /api/v1/auth/login
Response: {
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",  # Also in HTTP-only cookie
  "token_type": "bearer"
}

# Refresh access token
POST /api/v1/auth/refresh
Body: { "refresh_token": "eyJ..." }
Response: { "access_token": "new_token..." }
```

---

### 2. Rate Limiting ✅

**Global Rate Limit:**
- 100 requests per 60 seconds per IP
- Token bucket algorithm
- Automatic token refill

**Strict Rate Limit (Auth endpoints):**
- 5 requests per 60 seconds
- Prevents brute force attacks

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

**429 Response:**
```json
{
  "detail": "Rate limit exceeded. Please try again later.",
  "retry_after": 45
}
```

---

### 3. Password Strength Validation ✅

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character
- Not in common weak passwords list

**Example:**
```python
# Valid passwords
"MyP@ssw0rd"
"Secure123!"
"C0mpl3x!Pass"

# Invalid passwords
"password"      # Too weak
"12345678"      # No letters
"Password"      # No special char
"password123"   # Common weak password
```

---

### 4. CSRF Protection ✅

**Double-Submit Cookie Pattern:**
- CSRF token in HTTP-only cookie
- Same token in request header
- Validated on unsafe methods (POST, PUT, DELETE)

**Frontend Usage:**
```typescript
// Get CSRF token from cookie
const csrfToken = getCookie('csrf_token');

// Include in request headers
fetch('/api/v1/jobs', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

### 5. CORS Configuration ✅

**Development:**
```python
BACKEND_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173"
]
```

**Production:**
```python
ALLOWED_HOSTS = [
  "https://yourdomain.com",
  "https://www.yourdomain.com"
]
```

**Configured Methods:**
- GET, POST, PUT, DELETE, PATCH

**Credentials:** Allowed (for cookies)

---

### 6. Input Sanitization ✅

**Automatic Sanitization:**
- HTML special characters escaped
- Control characters removed
- Null bytes removed
- Length limits enforced

**Example:**
```python
from app.core.security import sanitize_input

# Input: "<script>alert('xss')</script>"
# Output: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"

sanitized = sanitize_input(user_input, max_length=1000)
```

---

### 7. SQL Injection Protection ✅

**SQLAlchemy ORM:**
- Parameterized queries
- Automatic escaping
- No raw SQL execution

**Safe Query Example:**
```python
# SAFE - Parameterized
result = await db.execute(
    select(User).where(User.username == username)
)

# UNSAFE - Never do this
# result = await db.execute(f"SELECT * FROM users WHERE username = '{username}'")
```

---

### 8. File Upload Validation ✅

**Restrictions:**
- Allowed extensions: pdf, doc, docx, txt, rtf, jpg, jpeg, png, gif
- Maximum size: 10MB
- MIME type validation
- Filename sanitization
- Path traversal prevention

**Example:**
```python
from app.core.security import validate_file_upload

is_valid, error = validate_file_upload(
    filename="resume.pdf",
    content_type="application/pdf",
    file_size=2048000  # 2MB
)

if not is_valid:
    raise HTTPException(400, detail=error)
```

---

## 🛡️ Security Headers

All responses include:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 🔧 Configuration

### Environment Variables

**Required:**
```bash
SECRET_KEY=your-super-secret-key-min-32-chars
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
```

**Security:**
```bash
CSRF_SECRET_KEY=your-csrf-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
RATE_LIMIT_ENABLED=true
ENABLE_CSRF_PROTECTION=true
```

**Production:**
```bash
ENVIRONMENT=production
DEBUG=false
SESSION_COOKIE_SECURE=true
ALLOWED_HOSTS=["yourdomain.com"]
```

---

## 🚀 Production Deployment Checklist

- [ ] Generate strong SECRET_KEY (32+ random characters)
- [ ] Generate strong CSRF_SECRET_KEY
- [ ] Set ENVIRONMENT=production
- [ ] Set DEBUG=false
- [ ] Configure ALLOWED_HOSTS with your domain
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set SESSION_COOKIE_SECURE=true
- [ ] Configure CORS with production domains
- [ ] Enable rate limiting
- [ ] Enable CSRF protection
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Review and update password requirements
- [ ] Test all security features

---

## 🧪 Testing Security

### Test Rate Limiting
```bash
# Should get 429 after 100 requests
for i in {1..101}; do
  curl http://localhost:8000/api/v1/jobs
done
```

### Test Password Strength
```bash
# Should fail
curl -X POST http://localhost:8000/api/v1/auth/register \
  -d '{"username":"test","email":"test@example.com","password":"weak"}'

# Should succeed
curl -X POST http://localhost:8000/api/v1/auth/register \
  -d '{"username":"test","email":"test@example.com","password":"MyP@ssw0rd123"}'
```

### Test CSRF Protection
```bash
# Should fail without CSRF token
curl -X POST http://localhost:8000/api/v1/jobs \
  -H "Authorization: Bearer token" \
  -d '{"title":"Job"}'
```

---

## 📚 Additional Security Recommendations

1. **Use HTTPS everywhere** - Required for secure cookies
2. **Regular security audits** - Review code and dependencies
3. **Keep dependencies updated** - `pip install --upgrade`
4. **Monitor logs** - Watch for suspicious activity
5. **Implement 2FA** - For admin accounts
6. **Regular backups** - Database and files
7. **Penetration testing** - Before production launch
8. **Security headers testing** - Use securityheaders.com
9. **SSL/TLS configuration** - Use Mozilla SSL Configuration Generator
10. **WAF (Web Application Firewall)** - Consider Cloudflare or AWS WAF

---

## 🆘 Security Incident Response

If you detect a security breach:

1. **Immediately revoke all tokens** - Change SECRET_KEY
2. **Force password reset** - For all users
3. **Review logs** - Identify attack vector
4. **Patch vulnerability** - Fix the issue
5. **Notify users** - If data was compromised
6. **Document incident** - For future prevention

---

## 📞 Security Contacts

- **Report vulnerabilities:** security@yourdomain.com
- **Bug bounty program:** (if applicable)
- **Security updates:** Subscribe to security mailing list
