# Deployment Guide

This project is configured for:

- Frontend on Vercel (Vite static app)
- Backend on Render (FastAPI web service)

## 1. Backend (Render)

Use the included blueprint file at `render.yaml`.

### Render setup

1. In Render, create a new Blueprint and point it to this repository.
2. Render will detect `render.yaml` and create the `ai-job-automation-backend` web service.
3. Confirm the service uses:
   - Root directory: `backend`
   - Build command: `pip install --upgrade pip ; pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/health`

### Required backend environment variables

Set these in Render:

- `DEBUG=false`
- `ENVIRONMENT=production`
- `SECRET_KEY=<strong-random-secret>`
- `MONGODB_URI=<your-mongodb-connection-string>`
- `MONGODB_DB_NAME=job_automation` (or your DB name)
- `REDIS_URL=<your-redis-url>`
- `BACKEND_CORS_ORIGINS=["https://your-frontend.vercel.app"]`
- `ALLOWED_HOSTS=["your-backend.onrender.com"]`

Optional:

- `OPENAI_API_KEY=<optional>`
- `GROQ_API_KEY=<optional>`
- SMTP vars if email is enabled (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAILS_FROM_EMAIL`)

Notes:

- `BACKEND_CORS_ORIGINS` and `ALLOWED_HOSTS` are parsed as lists, so pass JSON array strings.
- Production docs (`/docs`) are disabled when `DEBUG=false`.

## 2. Frontend (Vercel)

Frontend config file is at `frontend/vercel.json`.

### Vercel setup

1. In Vercel, import this repository.
2. Set **Root Directory** to `frontend`.
3. Framework preset: `Vite`.
4. Build command: `npm run build`.
5. Output directory: `dist`.

### Required frontend environment variables

Set these in Vercel Project Settings:

- `VITE_API_URL=https://your-backend.onrender.com/api/v1`
- `VITE_WS_URL=wss://your-backend.onrender.com/ws`

The SPA rewrite in `frontend/vercel.json` ensures client-side routes resolve to `index.html`.

## 3. Cross-service checklist

1. Deploy backend first, confirm health endpoint: `https://<render-service>/health`
2. Set frontend `VITE_API_URL` and `VITE_WS_URL` using the backend URL.
3. Add the exact Vercel domain to backend `BACKEND_CORS_ORIGINS`.
4. Redeploy backend after env var updates.
5. Redeploy frontend and test login, API calls, and websocket updates.
