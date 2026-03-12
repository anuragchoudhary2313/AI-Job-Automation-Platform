
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "job_automation")

async def force_migrate():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    
    print(f"Migrating DB: {MONGODB_DB_NAME}")
    
    collection = db.resumes
    cursor = collection.find()
    
    count = 0
    async for doc in cursor:
        updates = {}
        
        user_id = doc.get("user_id")
        if user_id and isinstance(user_id, str):
            try:
                updates["user_id"] = ObjectId(user_id)
            except Exception:
                pass
                
        job_id = doc.get("job_id")
        if job_id and isinstance(job_id, str):
            try:
                updates["job_id"] = ObjectId(job_id)
            except Exception:
                pass
                
        if updates:
            await collection.update_one({"_id": doc["_id"]}, {"$set": updates})
            count += 1
            print(f"Updated {doc['_id']}")

    print(f"Total migrated: {count}")

if __name__ == "__main__":
    asyncio.run(force_migrate())
