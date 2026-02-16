import asyncio
from app.db.mongo import init_db
from app.models.user import User

async def remove_user_from_team():
    await init_db()
    
    print("\n=== REMOVING USER FROM TEAM ===\n")
    
    # Find the user
    user = await User.find_one(User.email == "dynamicbaba6@gmail.com")
    
    if not user:
        print("ERROR: User 'dynamicbaba6@gmail.com' not found!")
        return
    
    print(f"User found: {user.email}")
    print(f"Current team_id: {user.team_id}")
    
    # Set team_id to None
    user.team_id = None
    await user.save()
    
    print(f"\n✓ User removed from team successfully!")
    print(f"New team_id: {user.team_id}")

if __name__ == "__main__":
    asyncio.run(remove_user_from_team())
