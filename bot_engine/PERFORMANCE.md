# Bot Engine Performance Optimization Guide

Optimizations for 100+ applications per hour safely.

## 🚀 Optimizations Implemented

### 1. Parallel Web Scraping ✅

**Thread pool for concurrent scraping:**
```python
scraper = ParallelScraper(
    max_workers=5,      # 5 concurrent browsers
    rate_limit=10,      # 10 requests/minute
    headless=True       # Headless mode
)

jobs = await scraper.scrape_jobs(job_urls)
```

**Features:**
- ThreadPoolExecutor with 5 workers
- Headless Chrome for efficiency
- Disabled images for faster loading
- Anti-detection measures

**Performance:**
- Sequential: 10-15s per job
- Parallel (5 workers): 10-15s for 5 jobs
- **5x faster** scraping

---

### 2. Rate Limiting ✅

**Avoid detection and respect limits:**
```python
rate_limiter = RateLimiter(
    max_requests=10,    # Max 10 requests
    time_window=60      # Per 60 seconds
)

await rate_limiter.acquire()  # Waits if limit exceeded
```

**Features:**
- Sliding window rate limiting
- Random delays (1-3s) for human-like behavior
- Automatic backoff when limit reached

**Safety:**
- Prevents IP bans
- Respects site limits
- Appears human-like

---

### 3. Resume Generation Queue ✅

**Worker pool for concurrent generation:**
```python
resume_queue = ResumeGenerationQueue(num_workers=3)
resume_queue.start()

# Submit task
task_id = await resume_queue.submit(
    task_id="resume_123",
    job_description="...",
    user_profile={...}
)

# Get result
result = await resume_queue.get_result(task_id, timeout=60)
```

**Features:**
- 3 worker threads
- Queue-based processing
- Async result retrieval
- Timeout handling

**Performance:**
- Sequential: 2-5s per resume
- Queue (3 workers): 2-5s for 3 resumes
- **3x throughput**

---

### 4. Async Email Sending ✅

**Non-blocking email operations:**
```python
await send_application_email(
    job=job,
    resume=resume,
    user_profile=user_profile
)
```

**Benefits:**
- Doesn't block job processing
- Concurrent email sending
- Faster overall pipeline

---

### 5. Concurrent Job Processing ✅

**Semaphore-controlled concurrency:**
```python
bot_engine = BotEngine(max_concurrent_jobs=10)

results = await bot_engine.process_jobs(
    jobs=jobs,
    user_profile=user_profile
)
```

**Features:**
- 10 concurrent job applications
- Semaphore for controlled concurrency
- Async/await throughout
- Error handling per job

**Performance:**
- Sequential: 15-20s per job
- Concurrent (10 jobs): 15-20s for 10 jobs
- **10x throughput**

---

## 📊 Performance Metrics

### Before Optimization

| Metric | Value |
|--------|-------|
| Jobs/Hour | 10-15 |
| Scraping | Sequential (10-15s each) |
| Resume Gen | Sequential (2-5s each) |
| Email | Blocking |
| Concurrency | 1 job at a time |

### After Optimization

| Metric | Value |
|--------|-------|
| Jobs/Hour | **100-150** ✅ |
| Scraping | Parallel (5 workers) |
| Resume Gen | Queue (3 workers) |
| Email | Async |
| Concurrency | 10 jobs simultaneously |

**Improvements:**
- **10x more** jobs per hour
- **5x faster** scraping
- **3x faster** resume generation
- **Non-blocking** email

---

## 🎯 Throughput Calculation

**Pipeline stages:**
1. Scrape job: 10-15s (parallel)
2. Generate resume: 2-5s (queue)
3. Send email: 1-2s (async)

**Total per job:** ~15-20s

**With 10 concurrent jobs:**
- 10 jobs in 15-20s
- 30 jobs per minute
- **180 jobs per hour** (theoretical max)
- **100-150 jobs per hour** (realistic with safety margins)

---

## 🛡️ Safety Features

### 1. Rate Limiting

**Prevents:**
- IP bans
- Account suspensions
- Detection as bot

**Configuration:**
```python
# Conservative (safer)
rate_limit=5  # 5 requests/minute

# Moderate (default)
rate_limit=10  # 10 requests/minute

# Aggressive (risky)
rate_limit=20  # 20 requests/minute
```

### 2. Random Delays

**Human-like behavior:**
- 1-3s random delay between requests
- Varies timing patterns
- Harder to detect

### 3. Anti-Detection

**Browser configuration:**
- Disabled automation flags
- Custom user agent
- No webdriver property
- Disabled images for speed

### 4. Error Handling

**Graceful failures:**
- Per-job error handling
- Doesn't crash entire batch
- Detailed error logging
- Retry capability

---

## 🔧 Configuration

### Environment Variables

```bash
# Bot Engine
MAX_CONCURRENT_JOBS=10
MAX_SCRAPER_WORKERS=5
SCRAPER_RATE_LIMIT=10

# Resume Queue
RESUME_WORKERS=3
RESUME_TIMEOUT=60

# Safety
HEADLESS_MODE=true
RANDOM_DELAY_MIN=1
RANDOM_DELAY_MAX=3
```

### Tuning for Performance

**Higher throughput (risky):**
```python
bot_engine = BotEngine(max_concurrent_jobs=20)
scraper = ParallelScraper(max_workers=10, rate_limit=20)
resume_queue = ResumeGenerationQueue(num_workers=5)
```

**Safer (conservative):**
```python
bot_engine = BotEngine(max_concurrent_jobs=5)
scraper = ParallelScraper(max_workers=3, rate_limit=5)
resume_queue = ResumeGenerationQueue(num_workers=2)
```

---

## 🧪 Usage Examples

### Basic Usage

```python
from bot_engine.engine import bot_engine

# Process scraped jobs
results = await bot_engine.process_jobs(
    jobs=jobs,
    user_profile=user_profile
)

print(f"Processed {results['successful']}/{results['total']} jobs")
print(f"Throughput: {results['jobs_per_hour']:.1f} jobs/hour")
```

### Scrape and Apply

```python
# Scrape and apply in one flow
results = await bot_engine.scrape_and_apply(
    job_urls=[
        "https://example.com/job/1",
        "https://example.com/job/2",
        # ... more URLs
    ],
    user_profile={
        'name': 'John Doe',
        'email': 'john@example.com',
        'skills': ['Python', 'FastAPI'],
        'experience': '5 years',
        'education': 'BS Computer Science'
    }
)
```

### Monitor Queue

```python
# Check resume queue size
queue_size = resume_queue.get_queue_size()
print(f"Pending resumes: {queue_size}")
```

---

## 📈 Monitoring

### Metrics to Track

1. **Jobs per hour**
2. **Success rate**
3. **Queue size**
4. **Error rate**
5. **Rate limit hits**

### Logging

```python
# All operations are logged
logger.info(f"Processed {total} jobs in {elapsed}s")
logger.warning(f"Rate limit reached. Waiting...")
logger.error(f"Failed to process job: {error}")
```

---

## 🔍 Troubleshooting

### Low Throughput

**Check:**
1. Rate limit too conservative
2. Too few workers
3. Slow resume generation
4. Network issues

**Solutions:**
- Increase rate limit carefully
- Add more workers
- Optimize resume prompts
- Check network speed

### Detection/Bans

**Check:**
1. Rate limit too aggressive
2. No random delays
3. Automation flags visible

**Solutions:**
- Reduce rate limit
- Increase random delays
- Check anti-detection settings
- Rotate user agents

### Queue Backlog

**Check:**
1. Too many submissions
2. Too few workers
3. Slow OpenAI API

**Solutions:**
- Add more workers
- Batch submissions
- Optimize prompts
- Check API limits

---

## 🚨 Best Practices

1. **Start conservative** - Begin with low rate limits
2. **Monitor closely** - Watch for detection/bans
3. **Gradual increase** - Slowly increase throughput
4. **Respect limits** - Don't exceed site limits
5. **Error handling** - Handle failures gracefully
6. **Logging** - Log everything for debugging
7. **Testing** - Test with small batches first
8. **Backups** - Keep job data for retries

---

## 📚 Additional Resources

- [Selenium Best Practices](https://www.selenium.dev/documentation/test_practices/)
- [Web Scraping Ethics](https://www.scrapehero.com/web-scraping-ethics/)
- [Rate Limiting Patterns](https://cloud.google.com/architecture/rate-limiting-strategies)
