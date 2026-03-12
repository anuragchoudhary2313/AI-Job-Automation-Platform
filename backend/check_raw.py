
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Manual config load
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "jobauto")

async def check_raw_data():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    
    print(f"DB: {MONGODB_DB_NAME}")
    
    resumes = await db.resumes.find().to_list(10)
    print(f"RE_COUNT: {len(resumes)}")
    for r in resumes:
        uid = r.get("user_id")
        print(f"RE_ID: {r['_id']} TYPE: {type(r['_id'])}")
        print(f"  UID: {uid} TYPE: {type(uid)}")
    
    users = await db.users.find().to_list(10)
    print(f"US_COUNT: {len(users)}")
    for u in users:
        print(f"US_ID: {u['_id']} EMAIL: {u.get('email')}")
        tid = u.get("team_id")
        print(f"  TID: {tid} TYPE: {type(tid)}")

if __name__ == "__main__":
    asyncio.run(check_raw_data())
