# 10 - Workflows

## 🤖 How to Use This Document (AI Instructions)

_Read this before debugging asynchronous pipeline failures._

- **Lifecycle Tracing:** Use this file to understand the lifecycle of complex asynchronous tasks. If asked to debug a failed job scrape or a broken PDF generation, trace the steps outlined here to identify which specific service (frontend, API, queue, or bot) is responsible for the failure.
- **Debug Strategy:** Follow these workflows in order before proposing fixes; isolate the first failing hop and debug that layer first.
- **Async Boundaries:** Preserve existing async boundaries (`BackgroundTasks`, worker queues, websocket updates).
- **API Discipline:** Do not replace service-layer API calls with direct client-side fetch logic.

## Scope

This document traces communication and execution across:

- Frontend (`frontend/src`): services, hooks, and page flows.
- Backend API (`backend/app/api/endpoints`).
- Backend services (`backend/app/services`).
- Bot engine runtime (`bot_engine/`).
- Persistence (Mongo collections via Beanie models).

## Workflow 1: Job Scraping (Frontend -> Backend -> Queue -> Bot Engine -> DB)

## A. Trigger from frontend

1. User submits scraper form in `frontend/src/pages/Jobs/components/JobScraper.tsx`.
2. UI calls `jobService.scrapeJobs(...)` in `frontend/src/services/job.service.ts`.
3. `jobService.scrapeJobs` sends `POST /jobs/scrape` via `apiClientLongTimeout`.
4. Frontend subscribes to live websocket activity via `useWebSocket` to display progress/status.

## B. Backend API entry

1. Request lands in `trigger_scrape` at `backend/app/api/endpoints/jobs.py` (`/jobs/scrape`).
2. Endpoint applies feature gate (`features.require("job_scraping")`).
3. Endpoint enriches keyword with `experience` and `job_type` when provided.
4. Endpoint queues work using FastAPI `BackgroundTasks.add_task(job_scraper_service.scrape_jobs, ...)`.
5. API returns immediately with started status.

## C. Queue layer (in-process async queue)

In this codebase, the queue stage for scraping is FastAPI `BackgroundTasks`.

- It is an in-process background task queue (not Redis/Celery/RQ).
- If the API process restarts, queued in-memory tasks are lost.
- This is the handoff boundary between API request thread and scraper execution.

## D. Scraper service execution

1. `job_scraper_service.scrape_jobs(...)` runs in `backend/app/services/job_scraper.py`.
2. Service sends websocket activity messages (`type=activity`, `title=Job Scraper`) via `SocketManager.send_to_user`.
3. Service launches browser through `BrowserManager` (`backend/app/automation/browser.py`).
4. Service instantiates `LinkedInScraper` (`backend/app/automation/scrapers/linkedin.py`).
5. Scraper attempts cookie reuse, navigates LinkedIn search, extracts cards, normalizes links.

## E. Bot Engine involvement

There are two paths:

Primary path (normal):

- Uses backend Playwright scraper classes only.
- No direct call to `bot_engine.engine.BotEngine`.

Fallback path (Windows Playwright-threading failure):

1. `job_scraper_service.scrape_jobs` catches `NotImplementedError` on Windows.
2. It imports `bot_engine.scrapers.linkedin.scrape_jobs_from_linkedin`.
3. Fallback scraper returns normalized job list.
4. Backend service continues dedupe and DB write flow.

Important:

- The full bot engine pipeline (`bot_engine/engine.py`) is not the default job scraping executor for `/jobs/scrape`.

## F. DB persistence and cache invalidation

1. For each scraped item, service checks duplicate by `ScrapedJob.link`.
2. New records inserted into `ScrapedJob` collection (`backend/app/models/job.py`, collection `scraped_jobs`).
3. Existing records are timestamp-refreshed (`created_at`) to keep them visible in recent window.
4. Service clears cache key pattern `jobs:scraped:*`.
5. Service emits final websocket success/error activity.
6. Frontend receives success, invalidates React Query keys (`jobs`, `scraped-jobs`), and updates UI.

## G. Failure isolation for scraping

- Frontend layer failure:
  - `jobService.scrapeJobs` not called or request blocked before API.
  - Symptom: no `/jobs/scrape` request.
- API layer failure:
  - Feature gate/auth/validation fails at endpoint.
  - Symptom: immediate HTTP error.
- Queue layer failure:
  - Background task not executed after API return.
  - Symptom: started response but no websocket progress and no DB updates.
- Bot/scraper layer failure:
  - Playwright launch, LinkedIn parsing, or fallback scraper error.
  - Symptom: websocket `type=error` from `Job Scraper`.
- DB layer failure:
  - Insert/save errors on `ScrapedJob`.
  - Symptom: scrape logs success-like progression but no persisted rows.

## Workflow 2: Resume Generation (`latex_gen.py`) and PDF Compilation

This repository currently has two related resume-generation tracks:

- Product UI flow (active): frontend `ResumeGenerator` -> backend AI LaTeX generation + Tectonic compile.
- Bot engine resume queue flow (worker-based): `bot_engine` queue and worker pipeline.

`bot_engine/resume/latex_gen.py` exists and exports `generate_latex_resume`, but is not currently wired into the active frontend PDF workflow.

## A. Active product flow (what users trigger in UI)

1. User opens `ResumeGenerator` in `frontend/src/pages/Resumes/components/ResumeGenerator.tsx`.
2. User provides JD and optional resume context text.
3. Frontend calls `POST /ai/resume/generate-latex` (via `apiClient`) to generate LaTeX.
4. Backend AI service (`ai_service.generate_latex_resume`) produces ATS-optimized LaTeX.
5. Frontend optionally requests ATS score via `POST /ai/resume/ats-score`.
6. Frontend calls `POST /resumes/compile-latex` (via `apiClientLongTimeout`) to compile PDF.
7. Backend endpoint `compile_latex` in `backend/app/api/endpoints/resumes.py`:
   - writes `.tex` to temp dir,
   - resolves `tectonic` binary,
   - bootstraps tectonic on non-Windows when missing,
   - runs subprocess compile,
   - returns PDF file response.
8. Frontend renders blob URL preview and allows download.
9. Optional save: frontend posts to `POST /resumes/save-generated` for library persistence.

## B. `latex_gen.py` flow in bot engine code

Module location:

- `bot_engine/resume/latex_gen.py`

Current role:

- Provides `generate_latex_resume(data: dict) -> str` using Jinja2 LaTeX template.
- Re-exported by `bot_engine/resume/__init__.py`.

Current wiring status:

- `bot_engine/queue/resume_queue.py` worker currently calls `_generate_resume(...)` placeholder text generator, not `generate_latex_resume`.
- Therefore, `latex_gen.py` is available but not currently in the live frontend resume generation path.

## C. Queue and bot engine resume pipeline

1. `BotEngine` (`bot_engine/engine.py`) starts `resume_queue` worker pool on init.
2. During `_process_single_job`, engine submits task to queue (`resume_queue.submit`).
3. Worker thread consumes task and runs `_generate_resume`.
4. Result is stored in in-memory `results` map with status (`pending/completed/failed`).
5. Caller polls using `resume_queue.get_result(task_id, timeout=60)`.

Queue characteristics:

- In-process Python thread queue (`queue.Queue`).
- Not backed by Redis or durable external broker.

## D. Failure isolation for resume/PDF issues

Broken PDF generation (user-facing):

- Frontend layer:
  - generation/compile request not sent or wrong payload.
  - Check `ResumeGenerator.tsx` request sequence.
- API layer:
  - `/ai/resume/generate-latex` or `/resumes/compile-latex` returns error.
  - Check endpoint logs and payload.
- Compiler layer:
  - `tectonic` missing/bootstrap failing or LaTeX syntax invalid.
  - Check `compile_latex` subprocess stderr/stdout detail.
- Queue/bot layer:
  - only relevant for bot-engine path, not default UI path.
  - Check `resume_queue` worker status and timeouts.

## Communication Layer Checklist (Fast Debug)

Use this quick checklist in order:

1. Confirm frontend call fired (`/jobs/scrape` or resume endpoints).
2. Confirm API accepted request (2xx with started/success payload).
3. Confirm queue handoff happened:
   - Scrape: FastAPI `BackgroundTasks`.
   - Bot resumes: `resume_queue.submit` + worker consumption.
4. Confirm bot/scraper execution logs:
   - Playwright scraper or bot engine worker path.
5. Confirm DB writes:
   - `ScrapedJob` inserts/updates for scraping.
   - Resume library save (`/resumes/save-generated`) when expected.
6. Confirm client receives completion signal:
   - websocket activity for scraping,
   - PDF blob response for compile flow.

## Known Architecture Boundaries to Preserve

- Job scraping queue is currently API-process `BackgroundTasks`; not externalized.
- Bot engine is mostly a separate runtime; scraping endpoint only imports bot scraper as fallback.
- Frontend resume PDF generation depends on backend AI + Tectonic compile, not directly on `bot_engine/resume/latex_gen.py`.
- If integrating `latex_gen.py` into active flow, update this document and align error-handling/ATS steps accordingly.
