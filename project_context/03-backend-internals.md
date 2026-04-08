# 03 Backend Internals

## How to Use This Document

Reference this file before writing new API endpoints or database queries. Ensure new code follows the existing patterns for rate-limiting, authentication (auth.py), and error handling defined here. If asked to modify a model, check this file to understand database relationships first.

Instructions for future AI instances:

- Treat this document as the backend implementation map for endpoint design, query changes, and service orchestration updates.
- Reuse existing dependency patterns from `app/api/deps.py` and existing service-layer boundaries instead of adding direct DB logic in endpoint handlers.
- Preserve feature-gate and auth behavior already present in endpoint modules.
- Keep endpoint behavior asynchronous and background-task-based where long-running operations already follow that pattern.

## Backend Scope

Analyzed areas:

- Routes: `backend/app/api/endpoints/*.py`
- Data models: `backend/app/models/*.py`
- Services: `backend/app/services/*.py`
- Supporting enforcement patterns:
  - auth dependencies in `backend/app/api/deps.py`
  - rate limiting middleware in `backend/app/core/rate_limit.py`
  - exception handling in `backend/app/core/error_handlers.py`

## Global Backend Patterns to Preserve

## Authentication and authorization

- OAuth2 bearer token dependency: `reusable_oauth2` in `deps.py`.
- Current user resolver: `get_current_user()` validates JWT and token type (access token only).
- Active user gate: `get_current_active_user()`.
- Admin gate: `require_admin()` checks `UserRole.ADMIN`.

## Rate limiting

Configured in app startup (`main.py`) using middleware classes from `rate_limit.py`:

- `RateLimitMiddleware` (default request limits)
- `StrictRateLimitMiddleware` for auth routes (5/min style profile)
- `AIRateLimitMiddleware` for `/api/v1/ai/*`

## Error handling

Centralized in `error_handlers.py`:

- global middleware wraps unhandled exceptions and assigns `request_id`.
- validation handler returns structured field-level errors.
- HTTP exception handler normalizes format and sanitizes 500 output in production.
- custom `AppException` handler returns consistent JSON payload.

## Endpoint design style

- Most endpoints authenticate with dependency injection (`Depends`).
- Long operations use `BackgroundTasks` and return immediately with status payloads.
- Pagination patterns use `skip/limit` and optional metadata envelopes.
- User-owned resources enforce ownership checks in service layer or handler logic.

## Complete Route Inventory (`app/api/endpoints`)

All routes below are mounted under `/api/v1` unless explicitly noted.

## `auth.py` (prefix `/auth`)

- `POST /auth/login` -> `login`
- `POST /auth/register` -> `register`
- `POST /auth/refresh` -> `refresh_token`
- `GET /auth/me` -> `get_current_user_info`
- `POST /auth/change-password` -> `change_password`
- `POST /auth/forgot-password` -> `forgot_password`
- `POST /auth/reset-password` -> `reset_password`

## `users.py` (no prefix at router include)

- `GET /me` -> `read_current_user`
- `GET /admin/users` -> `read_users`
- `GET /admin/users/{user_id}` -> `read_user_by_id`

## `jobs.py` (prefix `/jobs`)

- `GET|POST /jobs/scrape` -> `trigger_scrape`
- `GET /jobs/scraped` -> `list_scraped_jobs`
- `GET /jobs/stats` -> `get_stats`
- `GET /jobs` -> `list_jobs`
- `GET /jobs/{job_id}` -> `read_job`
- `POST /jobs` -> `create_job`
- `PUT /jobs/{job_id}` -> `update_job`
- `DELETE /jobs/{job_id}` -> `delete_job`

## `resumes.py` (prefix `/resumes`)

- `POST /resumes/upload` -> `upload_resume`
- `POST /resumes/extract-text` -> `extract_text`
- `POST /resumes/compile-latex` -> `compile_latex`
- `POST /resumes/save-generated` -> `save_generated_resume`
- `GET /resumes` -> `list_resumes`
- `GET /resumes/{resume_id}` -> `get_resume`
- `GET /resumes/{resume_id}/download` -> `download_resume`
- `DELETE /resumes/{resume_id}` -> `delete_resume`
- `GET /resumes/job/{job_id}` -> `get_resume_by_job`

## `ai.py` (prefix `/ai`)

- `POST /ai/resume/generate` -> `generate_resume_content`
- `POST /ai/resume/generate-structured` -> `generate_structured_resume`
- `POST /ai/resume/generate-latex` -> `generate_latex_resume`
- `POST /ai/resume/ats-score` -> `score_latex_resume`
- `POST /ai/cover-letter/generate-structured` -> `generate_structured_cover_letter`
- `POST /ai/resume/bullets` -> `generate_resume_bullets`
- `POST /ai/cover-letter` -> `generate_cover_letter`
- `POST /ai/match` -> `match_job_and_resume`
- `POST /ai/email` -> `personalize_email`

## `agent.py` (prefix `/agent`)

- `POST /agent/multi-apply` -> `multi_apply`
- `POST /agent/check-email` -> `check_email`
- `GET /agent/events` -> `get_automation_events`
- `GET /agent/dead-letters` -> `get_dead_letters`
- `POST /agent/dead-letters/{dead_letter_id}/status` -> `update_dead_letter_status`
- `POST /agent/dead-letters/{dead_letter_id}/replay` -> `replay_dead_letter`

## `admin.py` (prefix `/admin`)

- `GET /admin/stats` -> `get_admin_stats`
- `GET /admin/health` -> `get_system_health`
- `GET /admin/users` -> `list_all_users`
- `POST /admin/users` -> `create_user_admin`
- `PUT /admin/users/{user_id}/status` -> `toggle_user_status`
- `DELETE /admin/users/{user_id}` -> `delete_user`
- `GET /admin/dead-letters` -> `list_dead_letters_admin`
- `GET /admin/dead-letters/metrics` -> `get_dead_letter_metrics_admin`
- `POST /admin/dead-letters/{dead_letter_id}/status` -> `update_dead_letter_status_admin`
- `POST /admin/dead-letters/{dead_letter_id}/replay` -> `replay_dead_letter_admin`

## `bot_runner.py` (prefix `/bot`)

- `POST /bot/start` -> `start_bot`
- `GET /bot/status` -> `get_bot_status`

## `email.py` (prefix `/email`)

- `POST /email/send/hr` -> `send_hr_email`
- `POST /email/send/follow-up` -> `send_follow_up_email`
- `GET /email/test` -> `test_email_sending`

## `emails.py` (prefix `/emails`)

- `POST /emails/scrape-hr` -> `scrape_hr_emails`
- `GET /emails/check-cached/{company}` -> `check_cached_email`
- `POST /emails/validate-email` -> `validate_email`

## `email_automation.py` (prefix `/email-automation`)

- `POST /email-automation/auto-send` -> `auto_send_emails`

## `scheduler.py` (prefix `/scheduler`)

- `GET /scheduler/status` -> `get_scheduler_status`
- `POST /scheduler/restart` -> `restart_scheduler_endpoint`
- `GET /scheduler/jobs` -> `list_jobs`

## `logs.py` (prefix `/logs`)

- `GET /logs/` -> `list_logs`
- `GET /logs/{log_id}` -> `get_log`
- `GET /logs/log-test` -> `test_logging`

## `stats.py` (prefix `/stats`)

- `GET /stats/` -> `get_stats`

## `features.py` (prefix `/features`)

- `GET /features/` -> `get_features`

## `telegram.py` (prefix `/telegram`)

- `GET /telegram/test` -> `test_telegram_alert`

## `websockets.py` (mounted without API prefix route path)

- `WS /ws` -> `websocket_endpoint`

## Models (`app/models`) and Relationships

## Enums (`enums.py`)

- `UserRole`: `admin`, `user`
- `JobStatus`: `pending`, `applied`, `rejected`, `interviewing`, `offered`, `failed`

## Core documents

### `User` (`users`)

- Fields: `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, timestamps
- Unique indexes: `username`, `email`

### `Job` (`jobs`)

- Fields: role/company metadata, `status`, `skills_required`, `user_id`, timestamps
- Indexes include user/status and user/created_at compounds
- Relationship: many jobs belong to one user

### `ScrapedJob` (`scraped_jobs`)

- Fields: `title`, `company`, `location`, `link`, `description`, `posted_at`, `created_at`
- Used for scraper portal listings and dedupe by `link`

### `Resume` (`resumes`)

- Fields: `user_id`, optional `job_id`, file/content metadata, `parsed_data`, embeddings, timestamps
- Relationship: many resumes belong to one user; optional link to one job

### `Match` (`matches`)

- Fields: `user_id`, `resume_id`, `job_id`, `match_score`, `reasoning`, `created_at`
- Relationship bridge between user, resume, job

### `AutomationRun` (`automation_runs`)

- Fields: `user_id`, `resume_id`, `applied_jobs`, `status`, `applied_count`, timestamps

### `JobApplication` (`job_applications`)

- Fields: `company`, `role`, `decision`, `score`, `status`, `reply_received`, `user_id`, `created_at`
- Unique compound index `(company, role, user_id)`

### `AutomationEvent` (`automation_events`)

- Audit trail fields: `source`, `stage`, `action`, score/gate flags, metadata

### `AutomationDeadLetter` (`automation_dead_letters`)

- Failure persistence fields: `source`, `stage`, `task_name`, `error_message`, `payload`, retry/status metadata

### `Log` (`logs`) and `AgentLog` (`agent_logs`)

- Operational logs and AI/agent invocation traces

## Relationship summary

- `User` is the primary owner entity for jobs, resumes, matches, automation runs, logs, applications, events, and dead letters.
- `Resume` optionally maps to `Job` via `job_id` and participates in `Match`.
- `Match` explicitly ties one resume to one job for one user with score/reasoning.
- Automation tables (`AutomationRun`, `AutomationEvent`, `AutomationDeadLetter`) capture lifecycle, audit, and failure replay state.

## Services (`app/services`) Deep Map

## `auth_service.py` (`AuthService`)

Responsibilities:

- user login/register lifecycle
- token generation/refresh/reset-password workflows
- password change/reset logic
  Used by endpoints:
- `auth.py`

## `ai_service.py` (`AIService` + singleton `ai_service`)

Responsibilities:

- resume/cover-letter generation and formatting
- ATS scoring and match evaluation
- email personalization and recruiter reply classification
  Patterns:
- retry handling for model output parsing
- supports AI provider integration abstraction
  Used by:
- `ai.py`, `decision_agent.py`, `orchestrator_agent.py`, `bot.py`, `email_reader.py`

## `job_service.py` (`JobService`)

Responsibilities:

- user-scoped CRUD, filtering, stats
- paginated/list responses and dashboard aggregations
  Used by:
- `jobs.py`, `stats.py`

## `resume_service.py` (`ResumeService`)

Responsibilities:

- upload/save/get/delete resume artifacts
- parsing and generated resume persistence
  Used by:
- `resumes.py`, `bot.py`

## `job_scraper.py` (`JobScraperService`)

Responsibilities:

- Playwright-based LinkedIn scrape execution
- websocket progress events via `SocketManager`
- insert/update `ScrapedJob` collection with dedupe
- Telegram notifications and cache invalidation
  Used by:
- `jobs.py`, `orchestrator_agent.py`, scheduler jobs

## `email.py` (`EmailService` + singleton `email_service`)

Responsibilities:

- send email abstraction for app workflows
- retry/circuit breaker style resilience
  Used by:
- `job_service.py`, `email_automation.py`, `admin.py`, `bot.py`

## `email_scraper.py` (`EmailScraperService` + singleton `email_scraper`)

Responsibilities:

- discover HR/recruiter emails from company/domain
- validate addresses and cache results
  Used by:
- `emails.py`, `email_automation.py`, `job_service.py`

## `email_automation.py` (`EmailAutomationService`)

Responsibilities:

- automated campaign flow over recent scraped jobs
- per-job HR discovery + email send orchestration
  Used by:
- `email_automation.py` endpoint

## `email_reader.py` (`EmailReaderService`)

Responsibilities:

- mailbox polling and recruiter-reply classification
- update application state based on parsed replies
  Used by:
- `agent.py` (`/agent/check-email`)

## `match_service.py` (`MatchService`)

Responsibilities:

- compute/store match records between resume and job
  Used by:
- `bot.py`

## `matching_engine.py` (`JobMatchingEngine` / `matching_engine`)

Responsibilities:

- orchestrated multi-step match analysis workflow
  Used by:
- `ai.py` (`/ai/match`)

## `bot.py` (`BotService` + `run_job_automation`)

Responsibilities:

- periodic or on-demand auto-apply pipeline
- policy gate + ATS gate + application actions
- create `AutomationEvent` and `AutomationDeadLetter` for traceability
  Used by:
- `bot_runner.py`, scheduler jobs

## `automation_policy_service.py` (`AutomationPolicyService`)

Responsibilities:

- enforce policy decisions (caps, dedupe windows, blocked entities)
  Used by:
- `bot.py`, `orchestrator_agent.py`, replay flows

## `dead_letter_replay_service.py` (`DeadLetterReplayService`)

Responsibilities:

- queue and execute replay for dead-letter records
- backoff/rate-limit checks and state transitions
  Used by:
- `agent.py`, `admin.py`

## `memory_service.py` (`MemoryService`)

Responsibilities:

- retrieve historical successful patterns
  Used by:
- `decision_agent.py`, `orchestrator_agent.py`

## `socket_manager.py` (`SocketManager`, singleton `manager`)

Responsibilities:

- manage active/user-scoped websocket connections
- user-targeted send and broadcast helpers
  Used by:
- websocket endpoint, job scraper progress, bot runner live logs

## `resume.py` (legacy `ResumeService` variant)

Responsibilities:

- legacy/alternate resume generation behavior
  Note:
- coexists with `resume_service.py`; newer endpoint wiring uses `resume_service.py`.

## `__init__.py`

- package marker.

## Implementation Checklists for Future Changes

## Before creating a new endpoint

1. Confirm if similar behavior belongs in existing endpoint module.
2. Add dependency gates (`get_current_user`, `require_admin`, feature flag) as needed.
3. Put business logic in service layer, not in endpoint body.
4. Use existing error style (`AppException` handling / `HTTPException` patterns).
5. Consider rate limit impact for costly routes.

## Before writing a new query

1. Check model indexes and current query patterns in this file.
2. Keep user-scoped filtering consistent.
3. Reuse repository/service abstractions where present.
4. Ensure pagination and cache strategy matches neighboring endpoints.

## Before modifying a model

1. Review relationship impacts (`User` ownership graph, `Match`, automation tables).
2. Update dependent services and endpoint response schemas.
3. Validate index implications for listing and stats endpoints.
4. Re-check dead-letter/event flows if automation-related models are touched.
