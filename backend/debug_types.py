
import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User
from app.models.resume import Resume
from app.core.config import settings

async def debug_types():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[User, Resume])
    
    print("--- RAW Resumes from Collection ---")
    raw_resumes = await db.resumes.find().to_list(length=10)
    for r in raw_resumes:
        uid = r.get("user_id")
        print(f"Resume ID: {r['_id']} | user_id: {uid} | type(user_id): {type(uid)}")

    print("\n--- RAW Users from Collection ---")
    raw_users = await db.users.find().to_list(length=10)
    for u in raw_users:
        tid = u.get("team_id")
        print(f"User ID: {u['_id']} | email: {u.get('email')} | team_id: {tid} | type(team_id): {type(tid)}")

if __name__ == "__main__":
    asyncio.run(debug_types())
