
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Hardcode for migration to be safe
MONGODB_URI = "mongodb://localhost:27017"
MONGODB_DB_NAME = "job_automation"

async def force_migrate_v2():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    
    print(f"Migrating DB: {MONGODB_DB_NAME}")
    
    collection = db.resumes
    cursor = collection.find()
    
    count = 0
    async for doc in cursor:
        user_id = doc.get("user_id")
        job_id = doc.get("job_id")
        
        print(f"Doc {doc['_id']} UID Type: {type(user_id)}")
        
        updates = {}
        if isinstance(user_id, str):
            try:
                updates["user_id"] = ObjectId(user_id)
                print(f"  Migrating user_id: {user_id}")
            except Exception as e:
                print(f"  Error converting user_id: {e}")
                
        if job_id and isinstance(job_id, str):
            try:
                updates["job_id"] = ObjectId(job_id)
                print(f"  Migrating job_id: {job_id}")
            except Exception as e:
                print(f"  Error converting job_id: {e}")
                
        if updates:
            res = await collection.update_one({"_id": doc["_id"]}, {"$set": updates})
            if res.modified_count > 0:
                count += 1
                print(f"  Successfully updated {doc['_id']}")
            else:
                print(f"  No document modified for {doc['_id']}")

    print(f"Total migrated: {count}")

if __name__ == "__main__":
    asyncio.run(force_migrate_v2())
