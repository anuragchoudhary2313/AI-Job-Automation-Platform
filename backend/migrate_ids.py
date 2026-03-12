
import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User
from app.models.resume import Resume
from app.core.config import settings
from bson import ObjectId

async def migrate_resumes():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[User, Resume])
    
    print("--- Migrating Resumes ---")
    resumes_collection = db.resumes
    resumes = await resumes_collection.find().to_list(length=1000)
    
    migrated_count = 0
    for r in resumes:
        update_data = {}
        
        # Check user_id
        user_id = r.get("user_id")
        if isinstance(user_id, str):
            try:
                update_data["user_id"] = ObjectId(user_id)
            except Exception as e:
                print(f"Failed to convert user_id {user_id}: {e}")
        
        # Check job_id
        job_id = r.get("job_id")
        if isinstance(job_id, str):
            try:
                update_data["job_id"] = ObjectId(job_id)
            except Exception as e:
                print(f"Failed to convert job_id {job_id}: {e}")
                
        if update_data:
            await resumes_collection.update_one({"_id": r["_id"]}, {"$set": update_data})
            migrated_count += 1
            print(f"Migrated Resume {r['_id']}: {update_data.keys()}")

    print(f"\nMigration complete. Total records updated: {migrated_count}")

if __name__ == "__main__":
    asyncio.run(migrate_resumes())
