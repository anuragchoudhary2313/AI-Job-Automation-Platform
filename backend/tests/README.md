# Backend Test Suite

Comprehensive pytest test suite for the Job Automation SaaS backend.

## Test Coverage

### Authentication (`test_auth.py`)
- User registration and validation
- Login with JWT tokens
- Token expiration and refresh
- Role-based access control (Admin, Member, Viewer)
- Password hashing and security

### Job CRUD (`test_jobs.py`)
- Create, read, update, delete jobs
- Job filtering and search
- Pagination
- Status management
- User-scoped job access

## Running Tests

### Install test dependencies
```bash
pip install -r requirements-test.txt
```

### Run all tests
```bash
pytest
```

### Run specific test file
```bash
pytest tests/test_auth.py
pytest tests/test_jobs.py
```

### Run with coverage
```bash
pytest --cov=app --cov-report=html
```

### Run specific test class
```bash
pytest tests/test_auth.py::TestUserRegistration
```

### Run specific test
```bash
pytest tests/test_auth.py::TestUserRegistration::test_register_new_user
```

### Run tests by marker
```bash
pytest -m auth
pytest -m "not slow"
```

## Test Structure

```
tests/
├── __init__.py
├── conftest.py          # Fixtures and mocks
├── test_auth.py         # Authentication tests
└── test_jobs.py         # Job CRUD tests
```

## Mocked Services

- **SMTP**: Email sending
- **OpenAI**: AI resume generation
- **Selenium**: Web scraping
- **GitHub API**: Issue tracking

## Coverage Goals

- **Target**: >80% code coverage
- **Critical paths**: 100% coverage for auth and job access control
- **Integration tests**: Cover end-to-end flows

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run tests
  run: |
    pip install -r requirements-test.txt
    pytest --cov=app --cov-report=xml
    
- name: Upload coverage
  uses: codecov/codecov-action@v3
```
