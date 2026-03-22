import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def test_conn():
    # Load from environment variable for security
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("❌ Error: MONGODB_URI environment variable not set.")
        return
        
    print("Connecting to MongoDB...")
    try:
        # Increase timeout
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=10000)
        # Ping the server
        await client.admin.command('ping')
        print("✅ MongoDB Connection Successful!")
        
        # Check database
        db = client.job_automation
        collection_names = await db.list_collection_names()
        print(f"Collections: {collection_names}")
        
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
