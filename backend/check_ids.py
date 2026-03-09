import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.models.team import Team
from app.models.job import Job
from app.models.resume import Resume
from app.models.log import AgentLog, SystemLog
from app.models.automation import AutomationRun
from dotenv import load_dotenv
import os

async def main():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "job_automation")
    
    client = AsyncIOMotorClient(uri)
    await init_beanie(database=client[db_name], document_models=[User, Team, Job, Resume, AgentLog, SystemLog, AutomationRun])
    
    users = await User.find_all().to_list()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}")

if __name__ == "__main__":
    asyncio.run(main())
