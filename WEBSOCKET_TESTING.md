# WebSocket Real-Time Updates Testing Guide

## Overview

This guide covers testing the WebSocket integration in the Dashboard for real-time activity updates.

## Prerequisites

✅ **Backend Running**: `http://localhost:8000`  
✅ **Frontend Running**: `http://localhost:5173`  
✅ **User Logged In**: Valid authentication token  
✅ **WebSocket Endpoint**: `/ws` available

---

## Implementation Overview

### Components

1. **`useWebSocket` Hook** (`frontend/src/hooks/useWebSocket.ts`)
   - Manages WebSocket connection
   - Auto-reconnect on disconnect
   - Event handling for messages
   - Activity parsing and formatting

2. **ActivityFeed Component** (`frontend/src/pages/Dashboard/components/ActivityFeed.tsx`)
   - Displays real-time activities
   - Animated activity additions
   - Connection status indicator
   - "New" badge for fresh activities

3. **Dashboard** (`frontend/src/pages/Dashboard/index.tsx`)
   - WebSocket connection initialization
   - Toast notifications for events
   - Live connection indicator

---

## Test 1: WebSocket Connection

### Steps:
1. Login to application
2. Navigate to Dashboard (`/dashboard`)
3. Open browser DevTools → Console
4. Look for WebSocket connection logs

### Expected Results:
- ✅ Console shows: "WebSocket connected"
- ✅ Dashboard shows green "Live" indicator
- ✅ ActivityFeed shows "Live" status with WiFi icon
- ✅ No connection errors

### Verification:
```javascript
// Browser console - Network tab → WS
// Should see WebSocket connection to: ws://localhost:8000/ws?token=...
// Status: 101 Switching Protocols
```

---

## Test 2: Real-Time Activity Updates

### Trigger Backend Events

#### Option A: Job Scraping
```bash
# Trigger job scraping (generates activity)
curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Option B: Send Email
```bash
# Send email (generates activity)
curl -X POST "http://localhost:8000/api/v1/email/send/hr" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "recipient=test@example.com" \
  -F "subject=Test" \
  -F "body=Test email"
```

#### Option C: Generate Resume
```bash
# Generate resume (generates activity)
curl -X POST "http://localhost:8000/api/v1/ai/resume/bullets" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Software Engineer",
    "company": "Tech Corp",
    "job_description": "Build amazing software"
  }'
```

### Expected Results:
- ✅ New activity appears at top of ActivityFeed
- ✅ Activity animates in from left
- ✅ "New" badge appears briefly (3 seconds)
- ✅ Activity shows correct icon and color
- ✅ Timestamp shows "Just now"

---

## Test 3: Connection Status Indicator

### Steps:
1. Observe "Live" indicator in Dashboard
2. Stop backend server
3. Wait 3-5 seconds
4. Restart backend server

### Expected Results:
- ✅ Initially shows green "Live" with WiFi icon
- ✅ When disconnected, shows gray "Offline" with WifiOff icon
- ✅ Auto-reconnects after 3 seconds
- ✅ Returns to "Live" status

---

## Test 4: Auto-Reconnect

### Steps:
1. Open browser DevTools → Console
2. Watch WebSocket connection
3. Stop backend
4. Wait for disconnect message
5. Restart backend
6. Observe reconnection

### Expected Results:
- ✅ Console shows: "WebSocket disconnected"
- ✅ Console shows: "Attempting to reconnect..."
- ✅ Console shows: "WebSocket connected" (after 3s)
- ✅ No manual refresh needed

---

## Test 5: Multiple Activities

### Steps:
1. Trigger multiple backend events rapidly:
   ```bash
   # Scrape jobs
   curl ... /jobs/scrape &
   
   # Send email
   curl ... /email/send/hr &
   
   # Generate resume
   curl ... /ai/resume/bullets &
   ```

### Expected Results:
- ✅ All activities appear in feed
- ✅ Activities animate in sequentially
- ✅ Most recent at top
- ✅ Older activities pushed down
- ✅ Maximum 10 activities shown

---

## Test 6: Activity Types

Verify different activity types display correctly:

| Type | Icon | Color | Example |
|------|------|-------|---------|
| `apply` | Check | Blue | "Applied to job" |
| `email` | Mail | Purple | "Email sent" |
| `error` | AlertCircle | Red | "Scraping failed" |
| `resume` | FileText | Indigo | "Resume generated" |
| `scraping` | Briefcase | Green | "Jobs scraped" |

### Expected Results:
- ✅ Each type has correct icon
- ✅ Each type has correct color
- ✅ Icons are clearly visible

---

## Test 7: Toast Notifications

### Steps:
1. Trigger backend event
2. Watch for toast notification

### Expected Results:
- ✅ Success toast for successful operations
- ✅ Error toast for failures
- ✅ Toast auto-dismisses after 3-5 seconds

---

## Test 8: Empty State

### Steps:
1. Clear all activities (refresh page)
2. Don't trigger any events

### Expected Results:
- ✅ Shows "No recent activity" message
- ✅ Shows "Activities will appear here in real-time"
- ✅ No errors in console

---

## Test 9: Connection with Invalid Token

### Steps:
1. Logout
2. Manually set invalid token:
   ```javascript
   localStorage.setItem('access_token', 'invalid-token');
   ```
3. Navigate to Dashboard

### Expected Results:
- ✅ WebSocket connection fails gracefully
- ✅ Shows "Offline" status
- ✅ Console warns: "No auth token found" or "WebSocket error"
- ✅ No application crash

---

## Test 10: Performance

### Steps:
1. Trigger 20+ rapid events
2. Observe UI performance

### Expected Results:
- ✅ UI remains responsive
- ✅ Animations smooth (60fps)
- ✅ No memory leaks
- ✅ Only last 10 activities shown

---

## Backend WebSocket Implementation

### Check Backend Endpoint

```bash
# View WebSocket endpoint
curl http://localhost:8000/docs
# Look for: /ws endpoint
```

### Backend Should Send Messages Like:

```json
{
  "type": "activity",
  "data": {
    "activityType": "scraping",
    "title": "Jobs Scraped",
    "description": "Found 5 new jobs for Python Developer"
  },
  "timestamp": "2026-02-08T23:00:00Z"
}
```

---

## Troubleshooting

### Issue: "WebSocket connection failed"

**Solutions**:
1. Check backend is running on port 8000
2. Verify `VITE_WS_URL` in frontend `.env`
3. Check CORS settings in backend
4. Verify authentication token is valid

### Issue: "No activities appearing"

**Solutions**:
1. Check backend is sending WebSocket messages
2. Verify message format matches expected schema
3. Check browser console for parsing errors
4. Ensure `onActivity` callback is triggered

### Issue: "Connection keeps dropping"

**Solutions**:
1. Check network stability
2. Verify backend WebSocket handler is stable
3. Check for backend errors/crashes
4. Increase reconnect interval

### Issue: "Activities not animating"

**Solutions**:
1. Check Framer Motion is installed: `npm list framer-motion`
2. Verify no CSS conflicts
3. Check browser supports CSS animations
4. Clear browser cache

---

## Manual Testing Checklist

- [ ] WebSocket connects on Dashboard load
- [ ] "Live" indicator shows when connected
- [ ] "Offline" indicator shows when disconnected
- [ ] Auto-reconnect works after disconnect
- [ ] Job scraping triggers activity
- [ ] Email sending triggers activity
- [ ] Resume generation triggers activity
- [ ] Activities animate in smoothly
- [ ] "New" badge appears for fresh activities
- [ ] Correct icons for each activity type
- [ ] Correct colors for each activity type
- [ ] Toast notifications appear
- [ ] Maximum 10 activities shown
- [ ] Empty state displays correctly
- [ ] Invalid token handled gracefully
- [ ] Performance good with many activities
- [ ] No console errors
- [ ] No memory leaks

---

## Success Criteria

✅ WebSocket connects automatically  
✅ Real-time activities appear instantly  
✅ Connection status accurate  
✅ Auto-reconnect works reliably  
✅ Animations smooth and polished  
✅ No performance issues  
✅ Error handling graceful  

---

## Production Recommendations

1. **WebSocket URL Configuration**:
   ```bash
   # Production .env
   VITE_WS_URL=wss://api.yourdomain.com
   ```

2. **SSL/TLS**:
   - Use `wss://` (secure WebSocket)
   - Match HTTPS certificate

3. **Load Balancing**:
   - Sticky sessions for WebSocket
   - Or use Redis pub/sub for multi-server

4. **Monitoring**:
   - Track connection success rate
   - Monitor message delivery
   - Alert on high disconnect rate

5. **Rate Limiting**:
   - Limit messages per second
   - Prevent spam/abuse

---

**Test Date**: ___________  
**Tester**: ___________  
**Result**: ⬜ PASS / ⬜ FAIL  
**Activities Received**: ___________  
**Connection Stable**: ⬜ YES / ⬜ NO  
**Notes**: ___________
