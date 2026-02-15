# Frontend Test Suite

Comprehensive test suite using Vitest and React Testing Library.

## Test Coverage

### Component Tests
- **Login Form** (`Login.test.tsx`) - Form validation, submission, error handling
- **Dashboard** (`Dashboard.test.tsx`) - Metrics rendering, loading states, data display
- **JobsTable** (`JobsTable.test.tsx`) - Filtering, sorting, pagination, selection
- **ThemeToggle** (`ThemeToggle.test.tsx`) - Dark/light mode switching, persistence
- **Navigation** (`Navigation.test.tsx`) - Sidebar, routing, keyboard shortcuts
- **Notifications** (`Notifications.test.tsx`) - WebSocket real-time updates

### Unit Tests
- **Utilities** (`utils.test.ts`) - Helper functions, formatters, validators

## Running Tests

### Install dependencies
```bash
npm install
```

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test Login.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --grep "validation"
```

## Test Structure

```
src/
├── __tests__/
│   ├── Login.test.tsx
│   ├── Dashboard.test.tsx
│   ├── JobsTable.test.tsx
│   ├── ThemeToggle.test.tsx
│   ├── Navigation.test.tsx
│   ├── Notifications.test.tsx
│   └── utils.test.ts
├── test/
│   ├── setup.ts          # Global test setup
│   └── utils.tsx         # Test utilities and mocks
└── vitest.config.ts      # Vitest configuration
```

## Mocked APIs

- **fetch** - HTTP requests
- **localStorage** - Browser storage
- **WebSocket** - Real-time connections
- **matchMedia** - Media queries
- **IntersectionObserver** - Viewport detection
- **ResizeObserver** - Element resize detection

## Coverage Goals

- **Target**: >80% code coverage
- **Critical paths**: 100% for auth and forms
- **Components**: >90% for UI components

## Writing Tests

### Component Test Template
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/utils'
import { MyComponent } from '../components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText(/hello/i)).toBeInTheDocument()
  })
})
```

### User Interaction Test
```typescript
import userEvent from '@testing-library/user-event'

it('handles click', async () => {
  const user = userEvent.setup()
  render(<Button />)
  
  await user.click(screen.getByRole('button'))
  
  expect(mockFn).toHaveBeenCalled()
})
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run frontend tests
  run: |
    cd frontend
    npm install
    npm run test:coverage
    
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./frontend/coverage/coverage-final.json
```

## Best Practices

1. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test user behavior**: Focus on what users see and do
3. **Avoid implementation details**: Don't test internal state
4. **Use waitFor**: For async operations
5. **Clean up**: Tests should be isolated and not affect each other
