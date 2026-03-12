
import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User
from app.models.resume import Resume
from app.core.config import settings

async def debug_resumes():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.MONGODB_DB_NAME], document_models=[User, Resume])
    
    print("--- Users ---")
    users = await User.find_all().to_list()
    for u in users:
        print(f"User: {u.email}, ID: {u.id}, Team: {u.team_id}")
    
    print("\n--- Resumes ---")
    resumes = await Resume.find_all().to_list()
    for r in resumes:
        print(f"Resume ID: {r.id}, User ID: {r.user_id}, Filename: {r.filename}")

    if users:
        curr_user = users[0] # Just check the first one for logic verification
        print(f"\n--- Checking logic for user: {curr_user.email} ---")
        if curr_user.team_id:
            print(f"User has team: {curr_user.team_id}")
            team_users = await User.find(User.team_id == curr_user.team_id).to_list()
            user_ids = [u.id for u in team_users]
            print(f"Users in same team: {user_ids}")
            
            # Test query
            # Try both raw and beanie style
            res_raw = await Resume.find({"user_id": {"$in": user_ids}}).to_list()
            print(f"Resumes found (raw $in): {len(res_raw)}")
            
            from beanie.operators import In
            res_beanie = await Resume.find(In(Resume.user_id, user_ids)).to_list()
            print(f"Resumes found (Beanie In): {len(res_beanie)}")
        else:
            print("User has NO team")
            res_user = await Resume.find(Resume.user_id == curr_user.id).to_list()
            print(f"Resumes found for user: {len(res_user)}")

if __name__ == "__main__":
    asyncio.run(debug_resumes())
