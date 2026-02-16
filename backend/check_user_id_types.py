import asyncio
from app.db.mongo import init_db
from app.models.resume import Resume
from beanie import PydanticObjectId

async def check_user_id_types():
    await init_db()
    
    print("\n=== CHECKING RESUME USER_ID TYPES ===\n")
    
    # Get all resumes
    resumes = await Resume.find_all().to_list()
    
    for resume in resumes:
        print(f"Resume: {resume.filename}")
        print(f"  user_id value: {resume.user_id}")
        print(f"  user_id type: {type(resume.user_id)}")
        print(f"  Is PydanticObjectId: {isinstance(resume.user_id, PydanticObjectId)}")
        print(f"  Is string: {isinstance(resume.user_id, str)}")
        print()

if __name__ == "__main__":
    asyncio.run(check_user_id_types())
