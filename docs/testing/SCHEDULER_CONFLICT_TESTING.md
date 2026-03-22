# Manual Testing Guide: Scheduler Conflicts & Execution Locks

## Overview

This guide tests the scheduler's ability to prevent concurrent job execution and handle conflicts between manual triggers and scheduled jobs.

## Implementation Review

### Execution Lock Mechanism

**Location**: `backend/app/scheduler/job_wrapper.py`

The `with_execution_lock` decorator prevents concurrent execution:
- ✅ Uses Redis locks for distributed locking
- ✅ Configurable timeout per job
- ✅ Prevents duplicate job runs
- ✅ Logs lock acquisition/release

**Protected Jobs**:
1. `scrape_jobs_task` - 10 minute timeout
2. `check_follow_ups_task` - 5 minute timeout
3. `cleanup_old_logs_task` - 3 minute timeout
4. `run_job_automation_task` - 10 minute timeout

---

## Prerequisites

✅ **Backend Running**: `http://localhost:8000`  
✅ **Redis Running**: Required for distributed locks  
✅ **Scheduler Active**: Check `/api/v1/scheduler/status`  
✅ **Admin Access**: Required for scheduler endpoints

---

## Test 1: Verify Execution Lock Implementation

### Steps:

```bash
# Check if execution lock is implemented
grep -r "with_execution_lock" backend/app/scheduler/
```

### Expected Results:
- ✅ `job_wrapper.py` contains decorator
- ✅ `jobs.py` uses decorator on scheduled jobs

### Code Verification:

```python
# backend/app/scheduler/job_wrapper.py
@with_execution_lock(timeout_minutes=10)
async def scrape_jobs_task():
    # Job logic
```

---

## Test 2: Manual Trigger During Scheduled Execution

### Scenario:
Scheduled job is running, user manually triggers the same job.

### Steps:

1. **Start a long-running scheduled job**:
   ```bash
   # Trigger job scraping manually (simulates scheduled run)
   curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=25" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   This will take 30-60 seconds to complete.

2. **Immediately trigger again** (within 10 seconds):
   ```bash
   # Second trigger while first is running
   curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=25" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Expected Results:
- ✅ **First request**: Proceeds normally, acquires lock
- ✅ **Second request**: 
  - Either waits for lock (if timeout not exceeded)
  - Or returns error: "Job is already running"
- ✅ No duplicate scraping occurs
- ✅ Backend logs show lock acquisition/release

### Backend Logs:
```bash
# First request
"Acquiring lock for job: scrape_jobs_task"
"Lock acquired for job: scrape_jobs_task"
"Starting scrape for python in remote"
...
"Releasing lock for job: scrape_jobs_task"

# Second request (while first running)
"Acquiring lock for job: scrape_jobs_task"
"Failed to acquire lock for job: scrape_jobs_task (already running)"
```

---

## Test 3: Scheduled Job During Manual Execution

### Scenario:
User manually triggers job, then scheduled job tries to run.

### Steps:

1. **Manually trigger job scraping**:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=25" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Wait for scheduled job to trigger** (if scheduled within next minute)
   - Or manually trigger scheduler:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/scheduler/restart" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

### Expected Results:
- ✅ Manual trigger acquires lock
- ✅ Scheduled job waits or skips
- ✅ No concurrent execution
- ✅ Logs show lock conflict

---

## Test 4: Lock Timeout Handling

### Scenario:
Job takes longer than timeout, lock should be released.

### Steps:

1. **Modify timeout to very short** (for testing):
   ```python
   # In jobs.py, temporarily change:
   @with_execution_lock(timeout_minutes=0.1)  # 6 seconds
   async def scrape_jobs_task():
   ```

2. **Trigger long-running job**:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=50" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Wait 10 seconds, trigger again**

### Expected Results:
- ✅ First job times out after 6 seconds
- ✅ Lock is released
- ✅ Second job can acquire lock
- ⚠️ Warning logged: "Job exceeded timeout"

### Restore:
```python
# Restore original timeout
@with_execution_lock(timeout_minutes=10)
```

---

## Test 5: Multiple Different Jobs Concurrently

### Scenario:
Different jobs should run concurrently (different locks).

### Steps:

1. **Trigger job scraping**:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=10" \
     -H "Authorization: Bearer YOUR_TOKEN" &
   ```

2. **Immediately trigger log cleanup**:
   ```bash
   curl -X DELETE "http://localhost:8000/api/v1/logs/clear" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" &
   ```

### Expected Results:
- ✅ Both jobs run concurrently
- ✅ Different locks used
- ✅ No interference between jobs

---

## Test 6: Redis Connection Failure

### Scenario:
Redis is down, locks should fail gracefully.

### Steps:

1. **Stop Redis**:
   ```bash
   # Windows
   net stop Redis
   
   # Linux/Mac
   sudo systemctl stop redis
   ```

2. **Trigger job**:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=5" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Expected Results:
- ⚠️ Job may fail or proceed without lock
- ✅ Error logged: "Failed to acquire Redis lock"
- ✅ Application doesn't crash

### Restore:
```bash
# Start Redis again
net start Redis  # Windows
sudo systemctl start redis  # Linux/Mac
```

---

## Test 7: Scheduler Status Check

### Steps:

```bash
# Check scheduler status
curl -X GET "http://localhost:8000/api/v1/scheduler/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Expected Response:
```json
{
  "running": true,
  "jobs": [
    {
      "id": "scrape_jobs_task",
      "name": "Job Scraping",
      "next_run": "2026-02-08T23:30:00",
      "trigger": "cron",
      "running": false
    },
    {
      "id": "check_follow_ups_task",
      "name": "Check Follow-ups",
      "next_run": "2026-02-09T09:00:00",
      "trigger": "cron",
      "running": false
    }
  ]
}
```

### Verification:
- ✅ Scheduler is running
- ✅ Jobs are scheduled
- ✅ Next run times are correct
- ✅ No jobs stuck in "running" state

---

## Test 8: Force Job Execution

### Steps:

```bash
# Manually trigger scheduled job
curl -X POST "http://localhost:8000/api/v1/scheduler/job" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "scrape_jobs_task",
    "team_id": 1
  }'
```

### Expected Results:
- ✅ Job executes immediately
- ✅ Lock is acquired
- ✅ Job completes successfully
- ✅ Next scheduled run is not affected

---

## Test 9: Concurrent Manual Triggers (Stress Test)

### Scenario:
Multiple users trigger same job simultaneously.

### Steps:

```bash
# Trigger 5 concurrent requests
for i in {1..5}; do
  curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=5" \
    -H "Authorization: Bearer YOUR_TOKEN" &
done
wait
```

### Expected Results:
- ✅ Only 1 request acquires lock
- ✅ Other 4 requests wait or fail
- ✅ No duplicate scraping
- ✅ All requests eventually complete or error

### Backend Logs:
```bash
# Should see:
"Lock acquired for job: scrape_jobs_task" (once)
"Failed to acquire lock..." (4 times)
```

---

## Test 10: Lock Release on Error

### Scenario:
Job crashes, lock should be released.

### Steps:

1. **Introduce intentional error**:
   ```python
   # In job_scraper.py, add:
   async def scrape_jobs(...):
       raise Exception("Test error")
   ```

2. **Trigger job**:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/jobs/scrape?keyword=python&location=remote&limit=5" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Immediately trigger again**

### Expected Results:
- ✅ First job fails with error
- ✅ Lock is released (in finally block)
- ✅ Second job can acquire lock
- ✅ No deadlock

### Restore:
```python
# Remove the test error
```

---

## API Testing Scripts

### Check if Job is Running

```python
import requests

def is_job_running(job_id):
    response = requests.get(
        "http://localhost:8000/api/v1/scheduler/status",
        headers={"Authorization": f"Bearer {token}"}
    )
    jobs = response.json()["jobs"]
    for job in jobs:
        if job["id"] == job_id:
            return job["running"]
    return False

# Usage
if is_job_running("scrape_jobs_task"):
    print("Job is currently running")
else:
    print("Job is idle")
```

### Monitor Lock Status

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, db=0)

def check_lock(job_name):
    lock_key = f"job_lock:{job_name}"
    return r.exists(lock_key)

# Monitor
while True:
    if check_lock("scrape_jobs_task"):
        print("Lock held")
    else:
        print("Lock free")
    time.sleep(1)
```

---

## Monitoring & Debugging

### View Redis Locks

```bash
# Connect to Redis CLI
redis-cli

# List all locks
KEYS job_lock:*

# Check specific lock
GET job_lock:scrape_jobs_task

# Check lock TTL
TTL job_lock:scrape_jobs_task
```

### Backend Logs to Monitor

```bash
# Tail backend logs
tail -f backend/logs/app.log

# Filter for lock-related logs
tail -f backend/logs/app.log | grep -i "lock"
```

### Expected Log Patterns

**Successful Execution**:
```
[INFO] Acquiring lock for job: scrape_jobs_task
[INFO] Lock acquired for job: scrape_jobs_task
[INFO] Starting scrape for python in remote
[INFO] Scraping completed
[INFO] Releasing lock for job: scrape_jobs_task
```

**Lock Conflict**:
```
[INFO] Acquiring lock for job: scrape_jobs_task
[WARNING] Failed to acquire lock for job: scrape_jobs_task (already running)
[ERROR] Job execution blocked by existing lock
```

**Timeout**:
```
[INFO] Lock acquired for job: scrape_jobs_task
[WARNING] Job exceeded timeout of 10 minutes
[INFO] Releasing lock for job: scrape_jobs_task
```

---

## Performance Metrics

### Lock Acquisition Time

| Scenario | Expected Time | Acceptable Range |
|----------|---------------|------------------|
| Lock available | <10ms | 0-50ms |
| Lock held (wait) | Timeout duration | Up to timeout |
| Lock held (fail fast) | <10ms | 0-50ms |

### Job Execution Time

| Job | Expected Time | Timeout |
|-----|---------------|---------|
| Job Scraping (10 jobs) | 15-30s | 10 minutes |
| Follow-up Check | 5-15s | 5 minutes |
| Log Cleanup | 1-5s | 3 minutes |

---

## Troubleshooting

### Issue: Jobs always fail to acquire lock
**Solution**:
1. Check Redis is running: `redis-cli ping`
2. Check Redis connection in config
3. Clear stuck locks: `redis-cli KEYS "job_lock:*" | xargs redis-cli DEL`

### Issue: Lock never released
**Solution**:
1. Check if job crashed without cleanup
2. Manually delete lock: `redis-cli DEL job_lock:scrape_jobs_task`
3. Verify `finally` block executes

### Issue: Timeout too short
**Solution**:
```python
# Increase timeout in jobs.py
@with_execution_lock(timeout_minutes=20)  # Increase from 10
```

### Issue: Multiple jobs running concurrently
**Solution**:
1. Verify decorator is applied
2. Check Redis connection
3. Verify lock key is unique per job

---

## Testing Checklist

- [ ] Execution lock decorator implemented
- [ ] All scheduled jobs use decorator
- [ ] Manual trigger during scheduled run blocked
- [ ] Scheduled run during manual trigger blocked
- [ ] Lock timeout works correctly
- [ ] Different jobs run concurrently
- [ ] Redis failure handled gracefully
- [ ] Scheduler status shows correct info
- [ ] Force job execution works
- [ ] Concurrent manual triggers handled
- [ ] Lock released on error
- [ ] No deadlocks occur
- [ ] Logs show lock acquisition/release
- [ ] Redis locks visible in CLI

---

## Success Criteria

✅ No concurrent execution of same job  
✅ Locks acquired and released properly  
✅ Timeouts prevent indefinite locks  
✅ Manual and scheduled triggers don't conflict  
✅ Error handling releases locks  
✅ Different jobs run independently  
✅ Performance acceptable (<50ms lock overhead)  

---

## Production Recommendations

1. **Monitor Lock Metrics**:
   - Track lock acquisition failures
   - Alert on stuck locks (>timeout)
   - Monitor lock wait times

2. **Set Appropriate Timeouts**:
   - Based on 95th percentile execution time
   - Add 50% buffer for safety
   - Review and adjust periodically

3. **Implement Lock Cleanup**:
   - Periodic cleanup of expired locks
   - Health check to detect stuck locks
   - Auto-recovery mechanism

4. **Use Distributed Locks**:
   - Redis Cluster for high availability
   - Redlock algorithm for stronger guarantees
   - Fallback to database locks if Redis down

5. **Add Observability**:
   - Metrics: lock acquisition rate, wait time, failures
   - Traces: job execution timeline
   - Alerts: stuck locks, high failure rate

---

**Test Date**: ___________  
**Tester**: ___________  
**Redis Version**: ___________  
**Result**: ⬜ PASS / ⬜ FAIL  
**Lock Conflicts Detected**: ___________  
**Deadlocks**: ___________  
**Notes**: ___________
