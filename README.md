# AI Job Automation Platform

AI Job Automation Platform is a full-stack SaaS project for managing resumes, job discovery, AI-assisted matching/content, and application automation workflows.

## Monorepo Structure

- `backend/` - FastAPI backend (MongoDB + Beanie + Redis + scheduler)
- `frontend/` - React + TypeScript + Vite frontend
- `bot_engine/` - automation engine modules
- `scripts/` - repository-level test and utility scripts

## Core Stack

### Backend

- FastAPI
- Beanie + Motor (MongoDB)
- Redis
- APScheduler
- Pydantic v2

### Frontend

- React 18
- TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- Vitest + Testing Library

## Features (Current Scope)

- Authentication and user profile management
- Resume upload and resume generation flows
- Job scraping/listing and dashboard insights
- Email and automation endpoints/services
- WebSocket activity updates
- Admin and dead-letter monitoring pages

## Local Development

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB
- Redis

## 1) Backend Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Run backend:

```bash
# from backend/
python -m uvicorn app.main:app --reload
```

API health check:

- http://127.0.0.1:8000/health

## 2) Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend default dev URL:

- http://localhost:5173

## Environment Variables

Use these templates as starting points:

- `backend/.env.example`
- `frontend/.env.example`
- `.env.production.template`

## Testing

Run full repo tests with coverage (PowerShell):

```powershell
.\scripts\test-all.ps1
```

Backend and frontend each have their own test scripts under their local `scripts/` folders.

## Deployment

Deployment target for this repository:

- Frontend: Vercel
- Backend: Render

Deployment guide:

- `DEPLOYMENT.md`

Deployment manifests included:

- `frontend/vercel.json`
- `render.yaml`

## API and Runtime Notes

- API base path: `/api/v1`
- Health endpoint: `/health`
- WebSocket endpoint: `/ws`
- Production API docs are disabled when `DEBUG=false`

## Security and Operations

- Configure `SECRET_KEY` and `CSRF_SECRET_KEY` with strong random values in production
- Restrict `BACKEND_CORS_ORIGINS` and `ALLOWED_HOSTS` for production domains
- Configure external services (MongoDB/Redis/SMTP/AI keys) through environment variables

## Contributing

1. Create a feature branch
2. Make focused changes
3. Run tests/lint
4. Open a pull request

## License

Add your license information here (for example: MIT, Apache-2.0, or proprietary).
