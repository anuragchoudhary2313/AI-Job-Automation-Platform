import asyncio
from app.db.mongo import init_db
from app.models.user import User
from app.models.team import Team

async def check_and_fix_user_team():
    await init_db()
    
    print("\n=== CHECKING USER AND TEAMS ===\n")
    
    # Find the user
    user = await User.find_one(User.email == "dynamicbaba6@gmail.com")
    
    if not user:
        print("ERROR: User not found!")
        return
    
    print(f"User: {user.email}")
    print(f"Current team_id: {user.team_id}")
    
    # Get all teams
    teams = await Team.find_all().to_list()
    print(f"\nFound {len(teams)} teams in database:")
    
    for i, team in enumerate(teams):
        print(f"\n  Team {i+1}:")
        print(f"    ID: {team.id}")
        print(f"    Name: {team.name}")
        
        # Count users in this team
        team_users = await User.find(User.team_id == str(team.id)).to_list()
        print(f"    Users: {len(team_users)}")
        for u in team_users:
            print(f"      - {u.email}")
    
    # If user has no team, assign to first team
    if user.team_id is None and len(teams) > 0:
        first_team = teams[0]
        print(f"\n>>> Assigning user to team: {first_team.name}")
        user.team_id = str(first_team.id)
        await user.save()
        print(f"[OK] User assigned to team successfully!")
        print(f"New team_id: {user.team_id}")

if __name__ == "__main__":
    asyncio.run(check_and_fix_user_team())
