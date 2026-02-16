import asyncio
from app.db.mongo import init_db
from app.models.resume import Resume
from app.models.user import User

async def check_resumes():
    await init_db()
    
    print("\n=== CHECKING RESUMES IN DATABASE ===\n")
    
    # Get all resumes
    resumes = await Resume.find_all().to_list()
    print(f"Total resumes in DB: {len(resumes)}")
    
    for i, resume in enumerate(resumes):
        print(f"\nResume {i+1}:")
        print(f"  ID: {resume.id}")
        print(f"  user_id: {resume.user_id} (type: {type(resume.user_id).__name__})")
        print(f"  filename: {resume.filename}")
        print(f"  created_at: {resume.created_at}")
    
    print("\n=== CHECKING USERS IN DATABASE ===\n")
    
    # Get all users
    users = await User.find_all().to_list()
    print(f"Total users in DB: {len(users)}")
    
    for i, user in enumerate(users):
        print(f"\nUser {i+1}:")
        print(f"  ID: {user.id} (type: {type(user.id).__name__})")
        print(f"  email: {user.email}")
        print(f"  team_id: {user.team_id}")
    
    print("\n=== MATCHING RESUMES TO USERS ===\n")
    
    for resume in resumes:
        matching_user = None
        for user in users:
            if str(user.id) == str(resume.user_id):
                matching_user = user
                break
        
        if matching_user:
            print(f"Resume '{resume.filename}' belongs to user '{matching_user.email}' in team '{matching_user.team_id}'")
        else:
            print(f"Resume '{resume.filename}' has NO MATCHING USER (user_id: {resume.user_id})")

if __name__ == "__main__":
    asyncio.run(check_resumes())
