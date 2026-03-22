# Deployment Guide

This guide covers deploying the AI Job Automation Platform to various providers.

## Environment Variables

Ensure the following variables are set in your production environment:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=ai_job_automation
SECRET_KEY=long_secure_random_string
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## 1. Docker Compose (VPS / EC2)

The simplest way to deploy to a generic Linux server (AWS EC2, DigitalOcean, etc.).

1. **Clone the repo** to your server.
2. **Create `.env` file** with the variables above.
3. **Run**:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Access**:
   - Frontend: `http://your-server-ip`
   - API: `http://your-server-ip/api`

## 2. Render (PaaS)

Render supports `docker-compose` or individual services.

### Option A: Web Service (Backend) + Static Site (Frontend)

1. **Backend**:
   - New Web Service -> "Docker" -> Repo.
   - Root Directory: `backend`.
   - Environment Variables: `DATABASE_URL` (Internal connection string from Render Postgres).

2. **Database**:
   - New PostgreSQL database.

3. **Frontend**:
   - New Static Site -> Repo.
   - Build Command: `npm install && npm run build`.
   - Publish Directory: `dist`.
   - *Note*: You'll need to configure the frontend API URL to point to the Render Backend URL (via `.env` at build time `VITE_API_URL`).

## 3. Railway (PaaS)

Railway detects Dockerfiles automatically.

1. **Connect GitHub**.
2. **Postgres**: Add PostgreSQL plugin.
3. **Backend**:
   - Add Service -> GitHub Repo.
   - Root: `backend`.
   - Variable: `DATABASE_URL` (Reference `${{Postgres.CONNECTION_URL}}`).

4. **Frontend**:
   - Add Service -> GitHub Repo.
   - Root: `frontend`.
   - *Note*: You might need a custom Nginx setup or just use Railway's Static Site deployment if available, but Dockerfile works too.

## 4. Vercel (Frontend Only)

Ideal for the React frontend involving no Docker-for-frontend complexity.

1. **Import Project** from GitHub.
2. **Root Directory**: `frontend`.
3. **Framework Preset**: Vite.
4. **Environment Variables**:
   - `VITE_API_URL`: Your backend URL (e.g., on Render/Railway/EC2).
5. **Backend**: Deploy separately using Docker options above.
