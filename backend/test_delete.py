import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.models.team import Team
from app.models.job import Job
from app.models.resume import Resume
from app.models.log import AgentLog, Log
from app.models.automation import AutomationRun
from dotenv import load_dotenv
import os
import traceback

async def main():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "job_automation")
    
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(uri)
    await init_beanie(database=client[db_name], document_models=[User, Team, Job, Resume, AgentLog, Log, AutomationRun])
    
    # Create a dummy user to delete
    print("Creating test user...")
    test_user = User(
        username="test_delete_me",
        email="test_delete_me@example.com",
        password_hash="fake",
        full_name="Test Delete Me"
    )
    await test_user.insert()
    user_id = test_user.id
    print(f"Test user created with ID: {user_id}")
    
    try:
        print(f"Attempting to delete user {user_id}...")
        # Use the repository if possible, or just the model
        from app.repositories.user import UserRepository
        repo = UserRepository()
        await repo.delete(str(user_id))
        print("User deleted successfully via repo!")
    except Exception as e:
        print("Error caught during deletion!")
        traceback.print_exc()
        
    # Cleanup if it failed
    try:
        user = await User.get(user_id)
        if user:
            await user.delete()
            print("Cleaned up test user manually.")
    except:
        pass

if __name__ == "__main__":
    asyncio.run(main())
