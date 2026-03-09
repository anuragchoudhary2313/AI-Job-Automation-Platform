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
    
    email = "dynamicbaba6@gmail.com"
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    
    if result.modified_count > 0:
        print(f"Successfully promoted {email} to admin!")
    elif result.matched_count > 0:
        print(f"{email} was already an admin.")
    else:
        print(f"Could not find user with email {email}.")

if __name__ == "__main__":
    asyncio.run(main())
