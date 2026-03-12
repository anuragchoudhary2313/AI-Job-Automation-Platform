
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "job_automation")

async def inspect_db():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    
    print(f"DB: {MONGODB_DB_NAME}")
    collections = await db.list_collection_names()
    print(f"Collections: {collections}")
    
    for coll_name in ["resumes", "Resume"]:
        if coll_name in collections:
            print(f"\n--- Inspecting {coll_name} ---")
            coll = db[coll_name]
            count = await coll.count_documents({})
            print(f"Count: {count}")
            
            docs = await coll.find().to_list(1)
            if docs:
                doc = docs[0]
                print(f"Doc Keys: {list(doc.keys())}")
                for k, v in doc.items():
                    print(f"  {k}: {v} ({type(v)})")

if __name__ == "__main__":
    asyncio.run(inspect_db())
