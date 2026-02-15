# Testing Guide for Refactored Codebase

## Overview

This guide provides instructions for testing the refactored codebase to ensure all changes work correctly.

## 🎯 What Was Refactored

### Backend
- ✅ Repository pattern (4 repositories)
- ✅ Service layer (4 services)
- ✅ 20+ endpoints refactored
- ✅ Custom exceptions
- ✅ Centralized logging
- ✅ Full type hints

### Frontend
- ✅ TypeScript strict mode
- ✅ Centralized type definitions
- ✅ 6 custom hooks
- ✅ Logging utility
- ✅ API client
- ✅ Path aliases

---

## 📝 Pre-Testing Checklist

### Known Issues to Fix

The build may have TypeScript errors due to:
1. **Missing default exports** in page components (Dashboard, Resumes, Settings)
2. **Import path updates** needed for new utilities
3. **Type mismatches** from strict mode

### Quick Fixes Needed

#### 1. Fix Page Component Exports

Pages need default exports for lazy loading:

```typescript
// In Dashboard/index.tsx, Resumes/index.tsx, Settings/index.tsx, etc.
// Change from:
export function Dashboard() { ... }

// To:
export default function Dashboard() { ... }
// OR
function Dashboard() { ... }
export default Dashboard;
```

#### 2. Update Imports to Use Path Aliases

Replace relative imports with path aliases:

```typescript
// Before:
import { User } from '../../types/models';

// After:
import { User } from '@/types/models';
```

---

## 🧪 Testing Steps

### 1. Backend Testing

#### Type Check
```bash
cd backend
python -m mypy app/
```

**Expected:** No type errors (or minimal warnings)

#### Run Tests
```bash
cd backend
pytest
```

**Expected:** All tests pass

#### Test Coverage
```bash
cd backend
pytest --cov=app --cov-report=html
```

**Expected:** Coverage report generated in `htmlcov/`

#### Manual API Testing
```bash
cd backend
uvicorn app.main:app --reload
```

Test endpoints:
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/jobs/` - List jobs
- `GET /api/v1/stats/` - Get stats

---

### 2. Frontend Testing

#### Install Dependencies (if needed)
```bash
cd frontend
npm install
```

#### Development Server
```bash
cd frontend
npm run dev
```

**Expected:** Server starts on http://localhost:5173

#### Build (after fixing exports)
```bash
cd frontend
npm run build
```

**Expected:** Build succeeds, outputs to `dist/`

#### Run Tests
```bash
cd frontend
npm run test
```

**Expected:** All tests pass

#### Test Coverage
```bash
cd frontend
npm run test:coverage
```

**Expected:** Coverage report generated

---

## 🔍 Manual Testing Checklist

### Authentication Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Register new user
- [ ] Logout
- [ ] Token refresh

### Job Management
- [ ] List jobs
- [ ] Create new job
- [ ] Update job
- [ ] Delete job
- [ ] Search jobs
- [ ] Filter by status

### Resume Management
- [ ] Upload resume
- [ ] List resumes
- [ ] Download resume
- [ ] Delete resume

### UI/UX
- [ ] Navigation works
- [ ] Loading states display
- [ ] Error messages show
- [ ] Responsive design
- [ ] Dark mode toggle

### Performance
- [ ] Page load times
- [ ] API response times
- [ ] No console errors
- [ ] No memory leaks

---

## 🐛 Common Issues & Solutions

### Issue: TypeScript Build Fails

**Symptom:** `npm run build` fails with type errors

**Solution:**
1. Check error messages
2. Fix missing default exports in pages
3. Update imports to use path aliases
4. Ensure all types are properly defined

### Issue: Import Errors

**Symptom:** Cannot find module errors

**Solution:**
1. Check `tsconfig.app.json` has path aliases
2. Restart TypeScript server in IDE
3. Clear node_modules and reinstall

### Issue: API Calls Fail

**Symptom:** 401 Unauthorized or network errors

**Solution:**
1. Check backend is running
2. Verify API_URL in `.env`
3. Check CORS settings
4. Verify token in localStorage

---

## ✅ Success Criteria

### Backend
- ✅ All type hints valid
- ✅ All tests pass
- ✅ No runtime errors
- ✅ API endpoints respond correctly
- ✅ Logging works

### Frontend
- ✅ TypeScript build succeeds
- ✅ No console errors
- ✅ All routes work
- ✅ Custom hooks function correctly
- ✅ API integration works

---

## 📊 Expected Test Results

### Backend
```
======================== test session starts ========================
collected 50 items

tests/test_auth.py ........                                   [ 16%]
tests/test_jobs.py ............                               [ 40%]
tests/test_resumes.py ......                                  [ 52%]
tests/test_services.py ........................                [100%]

======================== 50 passed in 2.5s =========================
```

### Frontend
```
✓ src/hooks/useAuth.test.ts (5 tests)
✓ src/hooks/useJobs.test.ts (8 tests)
✓ src/utils/logger.test.ts (4 tests)

Test Files  3 passed (3)
     Tests  17 passed (17)
```

---

## 🚀 Next Steps After Testing

1. **Fix any failing tests**
2. **Update documentation** if needed
3. **Deploy to staging** for integration testing
4. **Monitor logs** for any issues
5. **Gather user feedback**

---

## 📞 Support

If you encounter issues:
1. Check error messages carefully
2. Review the refactoring walkthrough
3. Verify all dependencies are installed
4. Check that environment variables are set

---

## 🎓 Testing Best Practices

1. **Test in isolation** - Test each component/service independently
2. **Test edge cases** - Not just happy paths
3. **Test error handling** - Verify errors are caught and handled
4. **Test performance** - Check for slow queries or renders
5. **Test accessibility** - Ensure UI is accessible

---

## Summary

The refactored codebase introduces professional patterns that make testing easier:

- **Backend:** Services and repositories are easy to mock
- **Frontend:** Custom hooks isolate business logic
- **Both:** Type safety catches errors early

Follow this guide to verify everything works correctly! 🎉
