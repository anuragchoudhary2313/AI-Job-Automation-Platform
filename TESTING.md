# Testing & Coverage Guide

Comprehensive testing setup with coverage reporting for backend and frontend.

## Coverage Requirements

**Minimum Coverage Threshold: 80%**

- Lines: ≥ 80%
- Functions: ≥ 80%
- Branches: ≥ 80%
- Statements: ≥ 80%

Builds will **fail** if coverage drops below 80%.

## Quick Start

### Run All Tests with Coverage

**Linux/Mac:**
```bash
bash scripts/test-all.sh
```

**Windows:**
```powershell
.\scripts\test-all.ps1
```

### Backend Tests Only

**Linux/Mac:**
```bash
cd backend
bash scripts/test-coverage.sh
```

**Windows:**
```powershell
cd backend
.\scripts\test-coverage.ps1
```

**Manual:**
```bash
cd backend
pytest --cov=app --cov-report=html --cov-report=xml --cov-fail-under=80 -v
```

### Frontend Tests Only

**Linux/Mac:**
```bash
cd frontend
bash scripts/test-coverage.sh
```

**Windows:**
```powershell
cd frontend
.\scripts\test-coverage.ps1
```

**Manual:**
```bash
cd frontend
npm run test:coverage
```

## Coverage Reports

### Backend Coverage

- **HTML Report:** `backend/htmlcov/index.html`
- **XML Report:** `backend/coverage.xml`
- **Terminal:** Shows missing lines

```bash
# View HTML report
open backend/htmlcov/index.html  # Mac
xdg-open backend/htmlcov/index.html  # Linux
start backend/htmlcov/index.html  # Windows
```

### Frontend Coverage

- **HTML Report:** `frontend/coverage/index.html`
- **LCOV Report:** `frontend/coverage/lcov.info`
- **JSON Report:** `frontend/coverage/coverage-final.json`

```bash
# View HTML report
open frontend/coverage/index.html  # Mac
xdg-open frontend/coverage/index.html  # Linux
start frontend/coverage/index.html  # Windows
```

## Test Suites

### Backend (pytest)

- **Unit Tests:** `backend/tests/test_*.py`
- **Coverage:** 200+ tests
- **Areas:**
  - Authentication (login, register, JWT, roles)
  - Job CRUD (create, read, update, delete)
  - Team isolation (multi-tenant security)
  - Bot engine (scheduler, email, resume, scraping)

### Frontend (Vitest)

- **Unit Tests:** `frontend/src/__tests__/*.test.ts(x)`
- **Coverage:** 100+ tests
- **Areas:**
  - Login form validation
  - Dashboard metrics
  - Table filtering
  - Theme toggle
  - Navigation
  - WebSocket notifications

### E2E (Playwright)

- **Tests:** `e2e/*.spec.ts`
- **Coverage:** 30+ tests
- **Flows:**
  - Complete automation: login → bot → resume → email → dashboard → logs
  - Authentication flows
  - Dashboard updates
  - Logs visibility

## CI/CD Integration

### GitHub Actions

The `.github/workflows/test-coverage.yml` workflow:

1. Runs backend tests with coverage
2. Runs frontend tests with coverage
3. Uploads coverage to Codecov
4. Fails build if coverage < 80%
5. Posts coverage report to PR

### Local Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
bash scripts/test-all.sh
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Coverage Configuration

### Backend (.coveragerc)

```ini
[run]
source = app
omit = */tests/*, */migrations/*

[report]
precision = 2
show_missing = True

[html]
directory = htmlcov
```

### Frontend (vitest.config.ts)

```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

## Troubleshooting

### Coverage Below Threshold

1. **View HTML report** to see uncovered lines
2. **Add tests** for uncovered code
3. **Exclude** non-testable code (if justified)

### Tests Failing

```bash
# Run specific test
pytest backend/tests/test_auth.py::TestUserLogin::test_login_success -v

# Run with verbose output
pytest -vv

# Run with print statements
pytest -s
```

### Frontend Tests Failing

```bash
# Run specific test
npm test -- Login.test.tsx

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui
```

## Best Practices

1. **Write tests first** (TDD)
2. **Test behavior, not implementation**
3. **Keep tests isolated** (no shared state)
4. **Mock external services** (API, database)
5. **Aim for >80% coverage** on critical paths
6. **100% coverage** on auth and security code

## Codecov Integration

Add to your repository:

1. Sign up at [codecov.io](https://codecov.io)
2. Add `CODECOV_TOKEN` to GitHub secrets
3. Coverage reports auto-upload on CI

View coverage trends, file-by-file coverage, and PR diffs.

## Quick Commands

```bash
# Backend
pytest --cov=app --cov-report=term-missing
pytest --cov=app --cov-report=html
coverage report --skip-covered

# Frontend
npm run test:coverage
npm run test:ui

# E2E
npx playwright test
npx playwright test --headed
npx playwright show-report

# All
bash scripts/test-all.sh
```
