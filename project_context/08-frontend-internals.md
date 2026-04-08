# 08 - Frontend Internals

## 🤖 How to Use This Document (AI Instructions)

_Read this before generating any React code._

- **Reusability:** Before creating new React components, check this file to see if a relevant custom hook or UI component already exists.
- **API Access:** Do not write raw `fetch` requests. Always use the established API client methods from `src/services/` and shared clients in `src/lib/api.ts`.
- **State:** Keep state management consistent with the documented contexts. Use `AuthContext`/`FeatureContext`/`ThemeContext` for global concerns instead of duplicating local state.
- **Routing:** Preserve current authentication guard and redirect behavior in `MainLayout` when adding routes.

## Scope

Analyzed directories/modules:

- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/routes/ProtectedAppShell.tsx`
- `frontend/src/contexts/*`
- `frontend/src/hooks/*`
- `frontend/src/services/*`
- Key consumers in `frontend/src/pages/**` and `frontend/src/components/**`
- Shared API client in `frontend/src/lib/api.ts`

## Runtime Composition and Provider Order

Provider stack in `main.tsx` (outer to inner):

1. `QueryClientProvider`
2. `ThemeProvider`
3. `FeatureProvider`
4. `BrowserRouter`
5. `AuthProvider`
6. `App`

Why this matters:

- React Query cache is globally available to all UI/data hooks.
- Theme, feature flags, and auth state are initialized before route rendering.
- `AuthProvider` depends on router navigation (`useNavigate`), so it is intentionally nested inside `BrowserRouter`.

## Routing and Access Control Map

## Top-level route map (`App.tsx`)

Public routes:

- `/` -> `Landing`
- `/demo` -> `DemoDashboard`
- `/login` -> `Login`
- `/register` -> `Register`
- `/forgot-password` -> `ForgotPassword`
- `/reset-password` -> `ResetPassword`

Protected route group:

- Parent element: `MainLayout`
- Child routes rendered via `<Outlet />`:
  - `/dashboard` -> `Dashboard`
  - `/jobs` -> `Jobs`
  - `/resumes` -> `Resumes`
  - `/profile` -> `Profile`
  - `/email-campaigns` -> `EmailCampaigns`
  - `/settings` -> `Settings`
  - `/admin` -> `Admin`

Fallback:

- `*` -> `NotFoundPage`

## Effective guard behavior

`MainLayout` is the actual auth guard:

- If auth context is still loading: blocking spinner UI.
- If no authenticated user: `<Navigate to="/login" replace state={{ from: location }} />`.
- If authenticated: renders shell + `Outlet` and wraps children with `NotificationProvider`.

Important note:

- `routes/ProtectedAppShell.tsx` exists but is not currently mounted in `App.tsx`. Effective protection is in `MainLayout`.

## Global Contexts

## `AuthContext` (`contexts/AuthContext.tsx`)

State contract:

- `user: User | null`
- `isAuthenticated: boolean`
- `isLoading: boolean`
- `login(userData)`
- `updateUser(userData)`
- `logout()`

Initialization flow:

1. Checks `localStorage.skip_auth_verification` to avoid immediate duplicate `/auth/me` call after login/register.
2. If token exists, validates via `authService.getCurrentUser()`.
3. Timeout/offline behavior: falls back to cached `localStorage.user`.
4. Hard auth failure (`401`): clears tokens and user cache.

Side effects and ownership:

- Owns token/cache cleanup on logout (`access_token`, `refresh_token`, `user`).
- Owns redirect to `/login` via `useNavigate` on logout.
- Should remain the canonical app-level auth state, not duplicated in page-local state.

Primary consumers:

- Layout/auth shell: `components/layout/MainLayout.tsx`, `components/layout/Sidebar.tsx`
- Auth pages: `pages/Auth/Login.tsx`, `pages/Auth/Register.tsx`
- Profile page: `pages/Profile/index.tsx`

## `FeatureContext` (`contexts/FeatureContext.tsx`)

State contract:

- `features` object (flags like `ai_resume`, `job_scraping`, `admin_panel`, etc.)
- `isLoading`
- `isEnabled(feature)` helper

Initialization flow:

- Fetches `/features/` via shared `apiClient` with:
  - `timeout: 4000`
  - abort controller
  - `_suppressGlobalErrorToast: true`
- Falls back silently to default false flags if backend unavailable.

Primary consumers:

- Navigation visibility (`Sidebar`, `MainLayout` mobile nav)
- Feature-gated pages/components:
  - `Jobs` (`job_scraping` tabs and scraper UI)
  - `Resumes` (`ai_resume` generator)
  - dashboard quick actions/admin nav visibility

## `ThemeContext` (`contexts/user-theme.tsx`)

State contract:

- `theme: 'dark' | 'light'`
- `setTheme(theme)`

Behavior:

- Reads persisted theme from `localStorage` key (`vite-ui-theme` default).
- Falls back to `prefers-color-scheme` if no stored value.
- Applies class to document root (`light`/`dark`) and persists on change.

Primary consumers:

- `components/ui/ThemeToggle.tsx`
- `components/ui/CommandMenu.tsx` (theme command)

## API Client and Error Handling Contract

Shared client in `lib/api.ts`:

- `apiClient`: 30s timeout
- `apiClientLongTimeout`: 120s timeout for scraping/background-like operations

Common interceptor behavior (both clients):

- Adds `Authorization: Bearer <token>` from local storage
- Adds CSRF header (`X-CSRF-Token`) from cookie when present
- Removes explicit `Content-Type` for `FormData` to let browser set multipart boundary
- On `401`: attempts `/auth/refresh`, retries original request, otherwise clears tokens and redirects to `/login`
- On network/5xx errors: emits global toast unless `_suppressGlobalErrorToast` set

`getErrorMessage(error)` is the canonical normalizer for:

- network/timeout/offline cases
- FastAPI validation arrays (`detail` list)
- object/string detail payloads
- status-specific fallback messages

Rule for new frontend code:

- Use `apiClient`/`apiClientLongTimeout` and `getErrorMessage`; do not use raw `fetch` for backend APIs.

## Service Layer (API Surface)

## `auth.service.ts`

Methods:

- `login(formData)` -> `POST /auth/login`
- `register(data)` -> `POST /auth/register`
- `getCurrentUser()` -> `GET /auth/me`
- `refreshToken(refreshToken)` -> `POST /auth/refresh`
- `forgotPassword(email)` -> `POST /auth/forgot-password`
- `resetPassword(token, newPassword)` -> `POST /auth/reset-password`

Primary callers:

- `AuthContext` token verification (`getCurrentUser`)
- Auth pages (`Login`, `Register`, `ForgotPassword`, `ResetPassword`)

## `job.service.ts`

Methods:

- `getStats()` -> `GET /jobs/stats`
- `getJobs(filters)` -> `GET /jobs`
- `getJob(id)` -> `GET /jobs/:id`
- `createJob(data)` -> `POST /jobs`
- `updateJob(id, data)` -> `PUT /jobs/:id`
- `deleteJob(id)` -> `DELETE /jobs/:id`
- `scrapeJobs(...)` -> `POST /jobs/scrape` via `apiClientLongTimeout`

Primary callers:

- `Dashboard` (`getStats`)
- `ChartsSection` and `JobsTable` (`getJobs`)
- `JobsTable` (`updateJob`, `deleteJob`)
- `JobScraper` (`scrapeJobs`)

## `resume.service.ts`

Methods:

- `getResumes()` -> `GET /resumes`
- `uploadResume(file)` -> `POST /resumes/upload`
- `deleteResume(id)` -> `DELETE /resumes/:id`
- `downloadResume(id)` -> `GET /resumes/:id/download` (`blob`)
- `parseResume(id)` -> `POST /resumes/:id/parse`
- `generateTailoredResume(jobId, baseResumeId)` -> `POST /resumes/generate`

Primary callers:

- `useResumes` hook
- `Profile` page resume upload linkage

## `user.service.ts`

Methods:

- `getProfile()` -> `GET /users/me`
- `updateProfile(data)` -> `PUT /users/me`
- `uploadAvatar(file)` -> `POST /users/me/avatar`

Primary callers:

- `Profile` page (`updateProfile`)

## Hooks Inventory and Integration Map

## `useWebSocket` (`hooks/useWebSocket.ts`)

Architecture:

- Shared singleton socket (`sharedWs`) for entire app.
- Multi-subscriber fanout with subscriber registry.
- Heartbeat ping every 30s.
- Auto-reconnect with policy checks.
- Converts `activity` message payloads into normalized `Activity` model.

Primary consumers:

- `Dashboard` (connection status + notification/error toasts)
- `Dashboard/ActivityFeed` (live activity timeline)
- `Jobs/JobScraper` (scrape progress + completion triggers)
- `NotificationContext` (live in-app notifications)

Implementation caveat:

- Reconnection and duplicate events can happen; consumers like `ActivityFeed` already implement duplicate suppression by content/time window.

## `useResumes` (`hooks/useResumes.ts`)

Architecture:

- React Query backed list query (`['resumes']`)
- Upload/delete mutations with cache invalidation and toast side effects
- Browser download helper using `Blob` URL

Primary consumer:

- `pages/Resumes/index.tsx`

## `useDebounce` (`hooks/useDebounce.ts`)

Behavior:

- Returns delayed value by timeout cleanup cycle.

Primary consumer:

- `pages/Jobs/index.tsx` for debounced search filter input.

## `useApi` and `useApiWithRetry` (`hooks/useApi.ts`)

Behavior:

- Generic request executor wrapper around `apiClient`
- central loading/error/data state
- optional success/error callbacks and toasts
- `useApiWithRetry` tracks last config and manual retry count

Current usage:

- Utility hook available; not a primary path in current page flows.

## `useAuth` hook (`hooks/useAuth.ts`)

Behavior:

- Independent auth state implementation (separate from `AuthContext`)
- Performs `/auth/me`, login/register/logout token actions

Current usage status:

- Exported in hooks barrel but app pages/layout currently consume `contexts/AuthContext` directly.
- Treat as legacy/alternate auth hook; avoid introducing dual auth sources in new components.

## `useJobs` (`hooks/useJobs.ts`)

Behavior:

- Local-state CRUD wrapper over `/jobs/` endpoints

Current usage status:

- Present but not the dominant jobs data path in current UI (pages use React Query + `jobService`).

## `useAsync` (`hooks/useAsync.ts`)

Behavior:

- Generic async-state helper (`data/loading/error`) around arbitrary promise function.

Current usage:

- Utility hook available for future async workflows.

## `useLocalStorage` (`hooks/useLocalStorage.ts`)

Behavior:

- Typed JSON local storage read/write/remove wrapper.

Current usage:

- Utility; many current components still call `localStorage` directly.

## `usePerformance` (`hooks/usePerformance.ts`)

Exports:

- `useDebounce` (second implementation with different default delay)
- `useThrottle`
- `useFilteredData`
- `usePagination`
- `useLocalStorage` (second implementation)

Important caveat:

- Names overlap with `hooks/useDebounce.ts` and `hooks/useLocalStorage.ts`.
- New imports should be explicit to avoid accidental semantic drift.

## Page-Level Integration Flows

## Auth flow

Login (`pages/Auth/Login.tsx`):

1. Calls `authService.login(formData)`.
2. Persists tokens in local storage.
3. Sets `skip_auth_verification=true` for `AuthContext` fast-path.
4. Calls `AuthContext.login(user)` and navigates to `/dashboard`.

Register (`pages/Auth/Register.tsx`):

1. Calls `authService.register(...)`.
2. Auto-logins via `authService.login(formData)`.
3. Persists tokens + skip flag.
4. Calls `AuthContext.login(user)` and navigates to `/dashboard`.

Password reset flow:

- `ForgotPassword` -> `authService.forgotPassword(email)`
- `ResetPassword` -> `authService.resetPassword(token, password)`

## Jobs flow

`pages/Jobs/index.tsx` orchestrates feature-gated views:

- `job_scraping` enabled: `discover` / `scraped` / `applications` tabs
- otherwise defaults to `applications`

Data and actions:

- Search is debounced with `useDebounce`
- `JobsTable` reads jobs with React Query + `jobService.getJobs(filters)`
- status updates and deletions via `jobService.updateJob/deleteJob`
- scraper flow via `JobScraper` -> `jobService.scrapeJobs` and WS activity updates

## Resumes flow

`pages/Resumes/index.tsx`:

- Uses `useResumes` as primary resume data API
- Upload/delete/download are centralized through hook methods
- `ai_resume` feature gate controls `ResumeGenerator` visibility

## Profile flow

`pages/Profile/index.tsx`:

- Hydrates form from `AuthContext.user` + local profile cache (`PROFILE_STORAGE_KEY`)
- Saves local profile cache first, then attempts backend profile update via `userService.updateProfile`
- Updates app auth user model through `AuthContext.updateUser`
- Uploads resume via `resumeService.uploadResume` and stores linked resume metadata in profile state

## Reusable UI Components to Prefer Before Creating New Ones

General UI primitives:

- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Card.tsx`
- `components/ui/Table.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Modal.tsx`
- `components/ui/Toast.tsx`
- `components/ui/Tooltip.tsx`
- `components/ui/Skeleton.tsx`

Workflow and data display helpers:

- `components/EmptyState.tsx`
- `components/LoadingTable.tsx`
- `components/MetricCard.tsx`
- `components/VirtualizedTable.tsx`
- `components/NetworkStatus.tsx`

Layout and navigation:

- `components/layout/MainLayout.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/Breadcrumbs.tsx`
- `components/ui/CommandMenu.tsx`
- `components/ui/ThemeToggle.tsx`

## Frontend Conventions to Preserve

- Keep API IO inside service files and shared `apiClient` interceptors.
- Use React Query for server-state collections where cache/invalidations are needed.
- Use context (`AuthContext`, `FeatureContext`, `ThemeContext`) for cross-cutting global state.
- Keep auth redirect logic centralized in `MainLayout` + `AuthContext`.
- Continue websocket fanout through `useWebSocket`; avoid opening page-local raw sockets.
- Reuse existing UI components before adding new design-system variants.

## Known Duplication and Cleanup Opportunities (Do Not Break Behavior)

- Two auth abstractions exist (`contexts/AuthContext` and `hooks/useAuth`), but the app runtime currently relies on `AuthContext`.
- Duplicate utility names exist in `usePerformance` and dedicated hooks (`useDebounce`, `useLocalStorage`).
- `routes/ProtectedAppShell.tsx` is present but not wired into `App.tsx`.

These are refactor opportunities, not immediate defects. Maintain current contracts unless doing an intentional consolidation pass.
