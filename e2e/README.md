# End-to-End Testing with Playwright

Comprehensive E2E tests simulating real user interactions in a browser.

## Test Coverage

### Authentication Flow (`auth.spec.ts`)
- User registration
- Login with valid/invalid credentials
- Password visibility toggle
- Logout functionality
- Remember me
- Session expiration

### Bot Automation Flow (`bot-flow.spec.ts`)
- Complete automation: login → run bot → resume → email → dashboard → logs
- Scheduled bot automation
- Error handling
- Job filtering and search
- Bulk job applications
- Real-time progress tracking

### Dashboard & Logs (`dashboard-logs.spec.ts`)
- Real-time metrics display
- Metric updates on job status changes
- Charts visualization
- Activity feed
- Auto-refresh
- Log filtering (type, date, keyword)
- Log details view
- Log export
- Pagination
- Real-time log updates

## Running Tests

### Install Playwright
```bash
npm install -D @playwright/test
npx playwright install
```

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/bot-flow.spec.ts
npx playwright test e2e/dashboard-logs.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests on mobile
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### View test report
```bash
npx playwright show-report
```

## Test Structure

```
e2e/
├── auth.spec.ts           # Authentication flows
├── bot-flow.spec.ts       # Bot automation flows
├── dashboard-logs.spec.ts # Dashboard and logs
└── fixtures.ts            # Shared helpers
playwright.config.ts       # Playwright configuration
```

## Configuration

The tests are configured to:
- Run against `http://localhost:5173` (frontend)
- Start dev servers automatically
- Capture screenshots on failure
- Record video on failure
- Generate HTML report
- Retry failed tests on CI

## Test Data

Tests use a consistent test user:
- Username: `e2etest`
- Email: `e2etest@example.com`
- Password: `TestPassword123!`
- Team: `E2E Test Team`

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** with `expect().toBeVisible()`
3. **Use fixtures** for common setup (login, create job)
4. **Test user flows** not implementation details
5. **Clean up after tests** (delete test data)

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Debugging

### Run with UI mode
```bash
npx playwright test --ui
```

### Generate test code
```bash
npx playwright codegen http://localhost:5173
```

### View trace
```bash
npx playwright show-trace trace.zip
```

## Environment Variables

Set these in `.env` or CI:

```bash
BASE_URL=http://localhost:5173
API_URL=http://localhost:8000
CI=true  # Enable CI mode (more retries, parallel off)
```
