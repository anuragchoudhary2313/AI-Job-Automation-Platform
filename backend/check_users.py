import asyncio
from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "job_automation")
    
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    users = await db.users.find().to_list(10)
    print("Found users:")
    for u in users:
        print(f"User: {u.get('email')}, Role: {u.get('role')}")

if __name__ == "__main__":
    asyncio.run(main())
