# Authentication & Token Refresh Testing Guide

## Overview
This document provides a comprehensive testing guide for authentication, 401 handling, token refresh, and protected routes.

## Authentication Flow Architecture

### Frontend Implementation

**Location**: `frontend/src/lib/api.ts`

**Token Refresh Mechanism**:
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt token refresh
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/auth/refresh', {
          refresh_token: refreshToken
        });
        
        // Update access token
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Backend Implementation

**Location**: `backend/app/api/endpoints/auth.py`

**Refresh Token Endpoint**:
- **Route**: `POST /api/v1/auth/refresh`
- **Input**: `refresh_token` (string)
- **Output**: New `access_token` and same `refresh_token`
- **Validation**: Verifies JWT signature and token type

## Manual Testing Checklist

### Test 1: Normal Authentication Flow ✅

**Steps**:
1. Navigate to `/login`
2. Enter valid credentials
3. Click "Login"
4. Verify redirect to `/dashboard`
5. Check localStorage for `access_token` and `refresh_token`

**Expected Result**:
- User logged in successfully
- Tokens stored in localStorage
- Dashboard loads with user data

**Test Command**:
```javascript
// In browser console
console.log('Access Token:', localStorage.getItem('access_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
```

---

### Test 2: Protected Route Access ✅

**Steps**:
1. Without logging in, try to access `/dashboard`
2. Try to access `/resumes`
3. Try to access `/jobs`

**Expected Result**:
- MainLayout checks authentication
- If not authenticated, should redirect to `/login`
- After login, should redirect back to original route

**Implementation**: `frontend/src/components/layout/MainLayout.tsx`

---

### Test 3: Token Expiration & Auto-Refresh ⏳

**Steps**:
1. Login successfully
2. Wait for access token to expire (default: 30 minutes)
3. Make an API request (e.g., fetch resumes)
4. Observe network tab for:
   - Initial request returning 401
   - Automatic `/auth/refresh` call
   - Retry of original request with new token

**Expected Result**:
- First request fails with 401
- Token refresh happens automatically
- Original request retries and succeeds
- User experience is seamless (no logout)

**Simulation** (for faster testing):
```javascript
// In browser console - manually expire token
localStorage.setItem('access_token', 'expired_token_here');

// Then make any API call
// Should trigger auto-refresh
```

---

### Test 4: Refresh Token Expiration 🔴

**Steps**:
1. Login successfully
2. Manually invalidate refresh token:
   ```javascript
   localStorage.setItem('refresh_token', 'invalid_token');
   ```
3. Wait for access token to expire
4. Make an API request

**Expected Result**:
- Access token expires → 401
- Refresh attempt fails → 401
- User redirected to `/login`
- Tokens cleared from localStorage

---

### Test 5: Concurrent Request Handling ⏳

**Steps**:
1. Login successfully
2. Expire access token manually
3. Make multiple API requests simultaneously:
   ```javascript
   Promise.all([
     fetch('/api/v1/resumes'),
     fetch('/api/v1/jobs'),
     fetch('/api/v1/auth/me')
   ]);
   ```

**Expected Result**:
- Only ONE refresh request should be made
- All requests should wait for refresh
- All requests should retry with new token
- No race conditions

**Current Implementation**: ⚠️ May need improvement for concurrent requests

---

### Test 6: Manual Logout ✅

**Steps**:
1. Login successfully
2. Click "Logout" button
3. Verify tokens are cleared
4. Try to access protected route

**Expected Result**:
- Tokens removed from localStorage
- Redirect to `/login`
- Protected routes inaccessible

---

### Test 7: API Error Handling ✅

**Steps**:
1. Login successfully
2. Make request to non-existent endpoint
3. Make request with invalid data
4. Simulate network error

**Expected Result**:
- 404 errors shown to user
- 400 errors show validation messages
- 500 errors show generic error message
- Network errors show offline banner

---

## Backend Token Configuration

**Location**: `backend/app/core/config.py`

```python
# Token Settings
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 7     # 7 days
ALGORITHM = "HS256"
SECRET_KEY = "your-secret-key"
```

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type": application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

### Access Protected Endpoint
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Token Expiration
```bash
# Use expired or invalid token
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token"
# Should return 401 Unauthorized
```

## Known Issues & Recommendations

### ✅ Implemented
1. **Token Refresh on 401**: Automatic retry with new token
2. **Redirect on Refresh Failure**: Clears tokens and redirects to login
3. **Authorization Header Injection**: Automatic for all requests
4. **CSRF Token Support**: Headers include CSRF token if available

### ⚠️ Potential Improvements
1. **Concurrent Request Handling**: 
   - Current: Each 401 may trigger separate refresh
   - Recommended: Queue requests during refresh
   
2. **Token Refresh Race Condition**:
   - Issue: Multiple tabs may refresh simultaneously
   - Solution: Use BroadcastChannel API or shared worker

3. **Proactive Token Refresh**:
   - Current: Waits for 401
   - Recommended: Refresh before expiration (e.g., at 25 minutes)

4. **Refresh Token Rotation**:
   - Current: Same refresh token returned
   - Recommended: Issue new refresh token on each refresh

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| Normal Login | ✅ | Working as expected |
| Protected Routes | ✅ | MainLayout handles auth check |
| Token Auto-Refresh | ⏳ | Needs manual testing |
| Refresh Failure | ⏳ | Needs manual testing |
| Concurrent Requests | ⚠️ | May need improvement |
| Manual Logout | ✅ | Working as expected |
| Error Handling | ✅ | Proper error messages |

## Next Steps

1. **Manual Testing**: Test token expiration scenarios
2. **Concurrent Request Fix**: Implement request queuing during refresh
3. **Proactive Refresh**: Add timer-based refresh before expiration
4. **Token Rotation**: Implement refresh token rotation for security

---

**Last Updated**: 2026-02-08  
**Status**: Authentication flow implemented and verified. Manual testing required for token expiration scenarios.
