# Error Handling UX Guide

Comprehensive error handling implementation for better user experience.

## 🎯 Features Implemented

### 1. Error Boundary ✅
Catches React errors and shows friendly fallback UI instead of white screen.

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

**Features:**
- Friendly error message
- Try Again button
- Go Back / Home buttons
- No stack traces in production
- Automatic error logging

---

### 2. Toast Notifications ✅
User-friendly notifications for success, error, info, and warnings.

**Usage:**
```tsx
import { useToast } from '@/components/Toast';

function MyComponent() {
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      await api.post('/jobs', data);
      toast.success('Job created successfully!');
    } catch (error) {
      toast.error('Failed to create job');
    }
  };
}
```

**Toast Types:**
- `toast.success()` - Green checkmark
- `toast.error()` - Red alert
- `toast.info()` - Blue info
- `toast.warning()` - Yellow warning

**Features:**
- Auto-dismiss after 5 seconds
- Manual close button
- Slide-in animation
- Stacks multiple toasts
- Dark mode support

---

### 3. Network Status ✅
Detects offline/online state and shows banner.

**Components:**
- `<OfflineBanner />` - Shows at top when offline
- `<OfflineFallback />` - Full page offline state
- `useNetworkStatus()` - Hook to check connection

**Usage:**
```tsx
import { useNetworkStatus, OfflineFallback } from '@/components/NetworkStatus';

function MyComponent() {
  const isOnline = useNetworkStatus();

  if (!isOnline) {
    return <OfflineFallback onRetry={fetchData} />;
  }

  return <YourContent />;
}
```

---

### 4. API Error Handling ✅
Centralized error handling with user-friendly messages.

**Features:**
- Automatic token refresh on 401
- User-friendly error messages
- Network error detection
- Timeout handling
- CSRF token injection

**Error Messages:**
- `400` → "Invalid request. Please check your input."
- `401` → "Please log in to continue."
- `403` → "You don't have permission to do that."
- `404` → "The requested resource was not found."
- `429` → "Too many requests. Please slow down."
- `500` → "Server error. Please try again later."
- Network error → "Unable to connect to server."
- Timeout → "Request timed out. Please try again."

---

### 5. useApi Hook with Retry ✅
Custom hook for API calls with automatic error handling.

**Basic Usage:**
```tsx
import { useApi } from '@/hooks/useApi';

function JobsList() {
  const { data, loading, error, execute } = useApi({
    showSuccessToast: true,
    successMessage: 'Jobs loaded!',
  });

  useEffect(() => {
    execute({ method: 'GET', url: '/jobs' });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <JobsTable data={data} />;
}
```

**With Retry:**
```tsx
import { useApiWithRetry } from '@/hooks/useApi';

function JobsList() {
  const { data, loading, error, execute, retry, canRetry } = useApiWithRetry();

  useEffect(() => {
    execute({ method: 'GET', url: '/jobs' });
  }, []);

  if (error) {
    return (
      <ErrorPage
        message={error}
        onRetry={canRetry ? retry : undefined}
      />
    );
  }

  return <JobsTable data={data} />;
}
```

---

### 6. Error Pages ✅
Reusable error page components.

**Components:**
- `<ErrorPage />` - Generic error page
- `<NotFoundPage />` - 404 page
- `<LoadingWithError />` - Loading with error fallback

**Usage:**
```tsx
import { ErrorPage, NotFoundPage } from '@/components/ErrorPage';

// Generic error
<ErrorPage
  title="Failed to load data"
  message="We couldn't load your jobs. Please try again."
  onRetry={fetchJobs}
/>

// 404
<Route path="*" element={<NotFoundPage />} />

// Loading with error
<LoadingWithError loading={loading} error={error} onRetry={retry}>
  <YourContent />
</LoadingWithError>
```

---

## 🎨 User Experience

### No Raw Errors
❌ **Before:**
```
Error: Network Error
  at XMLHttpRequest.handleError (axios.js:123)
  at createError (createError.js:16)
```

✅ **After:**
```
Unable to connect to server. Please try again later.
[Try Again] [Go Home]
```

### Friendly Messages
All errors are translated to user-friendly language:
- Technical → Human-readable
- Stack traces → Hidden in production
- Error codes → Helpful descriptions

### Visual Feedback
- Toast notifications for quick feedback
- Loading spinners for async operations
- Error icons and colors
- Retry buttons for failed operations

---

## 📋 Implementation Checklist

- [x] Error Boundary component
- [x] Toast notification system
- [x] Network status detection
- [x] Offline banner
- [x] API client with error handling
- [x] Token refresh on 401
- [x] User-friendly error messages
- [x] useApi hook
- [x] useApiWithRetry hook
- [x] Error page components
- [x] 404 Not Found page
- [x] Loading states
- [x] Retry functionality
- [x] CSS animations

---

## 🧪 Testing Error Handling

### Test Error Boundary
```tsx
// Throw error to test boundary
function BuggyComponent() {
  throw new Error('Test error');
}

<ErrorBoundary>
  <BuggyComponent />
</ErrorBoundary>
```

### Test Toast
```tsx
toast.success('Success message');
toast.error('Error message');
toast.info('Info message');
toast.warning('Warning message');
```

### Test Offline
```tsx
// In DevTools Console
window.dispatchEvent(new Event('offline'));
// Should show offline banner

window.dispatchEvent(new Event('online'));
// Should show "Back online" message
```

### Test API Errors
```tsx
// Simulate 500 error
await api.get('/nonexistent-endpoint');
// Should show: "Server error. Please try again later."

// Simulate network error
// Turn off server
await api.get('/jobs');
// Should show: "Unable to connect to server."
```

---

## 🚀 Best Practices

1. **Always wrap app in ErrorBoundary**
2. **Use toast for user actions** (save, delete, update)
3. **Show loading states** for async operations
4. **Provide retry buttons** for failed requests
5. **Hide technical details** in production
6. **Log errors** to monitoring service
7. **Test offline scenarios**
8. **Use semantic error messages**

---

## 🔧 Configuration

### Environment Variables
```env
VITE_API_URL=http://localhost:8000/api/v1
NODE_ENV=production  # Hides stack traces
```

### Customize Toast Duration
```tsx
toast.success('Message', 3000);  // 3 seconds
toast.error('Message', 0);       // No auto-dismiss
```

### Custom Error Fallback
```tsx
<ErrorBoundary fallback={CustomErrorPage}>
  <App />
</ErrorBoundary>
```
