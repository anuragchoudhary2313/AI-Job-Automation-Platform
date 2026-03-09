import asyncio
from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.repositories.user import UserRepository
from app.repositories.team import TeamRepository
from app.services.auth_service import AuthService
from app.core.config import settings
import traceback

async def main():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "job_automation")
    
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    user_repo = UserRepository()
    team_repo = TeamRepository()
    auth_service = AuthService(user_repo, team_repo)
    
    try:
        print("Triggering forgot_password...")
        # Since auth_service uses beanie inside repositories, we need to initialize Beanie
        from beanie import init_beanie
        from app.models.user import User
        from app.models.team import Team
        from app.models.job import Job
        from app.models.resume import Resume
        from app.models.log import AgentLog, SystemLog
        from app.core.security import Match
        
        # we can't easily mock the beanie models outside of fastapi startup 
        # so we will just run the raw requests to see if that gives an error
        await auth_service.forgot_password("dynamicbaba6@gmail.com")
        print("Success")
    except Exception as e:
        print("Error caught!")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
