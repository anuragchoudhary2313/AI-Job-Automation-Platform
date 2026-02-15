# Smoke Tests

This directory contains smoke tests for critical user flows.

## Running Tests

```bash
# Run all smoke tests
pytest tests/smoke/ -v

# Run specific test class
pytest tests/smoke/test_smoke.py::TestAuthenticationFlow -v

# Run with detailed output
pytest tests/smoke/ -v -s

# Run and stop on first failure
pytest tests/smoke/ -v -x
```

## Test Coverage

- Authentication Flow
- Resume Management Flow
- Job Scraping Flow
- Scheduler Flow
- Statistics Flow
- WebSocket Connectivity
