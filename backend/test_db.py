import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def test_conn():
    uri = "mongodb+srv://anuragchoudhary603_db_user:Htm25OddTdJoJRWC@cluster0.c7lhl3y.mongodb.net/job_automation?appName=Cluster0"
    print(f"Connecting to {uri}...")
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
