from fastapi import APIRouter
from app.api.endpoints import auth, websockets, scheduler, logs, stats, resumes, jobs, ai, email, telegram, users, teams

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(scheduler.router, prefix="/schedule", tags=["schedule"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(websockets.router, tags=["websockets"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(email.router, prefix="/email", tags=["email"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
from app.api.endpoints import features
api_router.include_router(features.router, prefix="/features", tags=["features"])

api_router.include_router(users.router, tags=["users"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
