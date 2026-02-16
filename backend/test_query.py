import asyncio
from app.db.mongo import init_db
from app.models.resume import Resume
from app.models.user import User
from beanie import PydanticObjectId

async def test_query():
    await init_db()
    
    print("\n=== TESTING RESUME QUERY ===\n")
    
    # Get the user
    user = await User.find_one(User.email == "dynamicbaba6@gmail.com")
    if not user:
        print("ERROR: User not found!")
        return
    
    print(f"User found: {user.email}")
    print(f"User ID: {user.id} (type: {type(user.id)})")
    print(f"Team ID: {user.team_id}")
    
    # Find users in the same team
    print(f"\nFinding users in team: {user.team_id}")
    team_users = await User.find(User.team_id == user.team_id).to_list()
    print(f"Found {len(team_users)} users in team")
    
    user_ids = [PydanticObjectId(u.id) for u in team_users]
    print(f"User IDs: {[str(uid) for uid in user_ids]}")
    
    # Query resumes
    print(f"\nQuerying resumes with user_id in {[str(uid) for uid in user_ids]}")
    resumes = await Resume.find({"user_id": {"$in": user_ids}}).to_list()
    print(f"Found {len(resumes)} resumes")
    
    for resume in resumes:
        print(f"  - {resume.filename} (user_id: {resume.user_id})")
    
    # Also try direct query
    print(f"\nDirect query for user_id == {user.id}")
    direct_resumes = await Resume.find(Resume.user_id == PydanticObjectId(user.id)).to_list()
    print(f"Found {len(direct_resumes)} resumes")
    
    for resume in direct_resumes:
        print(f"  - {resume.filename}")

if __name__ == "__main__":
    asyncio.run(test_query())
