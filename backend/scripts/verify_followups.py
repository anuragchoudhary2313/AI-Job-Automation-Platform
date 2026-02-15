import asyncio
import logging
import sys
import os
from datetime import datetime, timedelta

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.db.models import Job, JobStatus, Team, User
from app.scheduler.jobs import check_follow_ups_task
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_dummy_data():
    """Create a dummy job applied 4 days ago."""
    async with AsyncSessionLocal() as db:
        # Ensure we have a team (needed for FK)
        team = Team(name="Test Team")
        db.add(team)
        await db.flush()
        
        # Create dummy job
        job = Job(
            title="Old Application Developer",
            company="Ghost Corp",
            description="Testing followups",
            location="Remote",
            status=JobStatus.APPLIED,
            applied_at=datetime.now() - timedelta(days=4), # 4 days ago
            team_id=team.id
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        print(f"Created dummy job: {job.title} applied on {job.applied_at}")
        return job.id

async def verify_followups():
    print("Testing Follow-up Logic...")
    
    try:
        # 1. Create Data
        job_id = await create_dummy_data()
        
        # 2. Run Task
        print("Running check_follow_ups_task...")
        await check_follow_ups_task()
        
        print("✅ Task executed. Check Telegram for alert.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_followups())
