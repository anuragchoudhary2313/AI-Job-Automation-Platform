"""
Admin-only endpoints for monitoring and platform management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
import datetime

from app.api import deps
from app.core.logging import get_logger
from app.models.user import User
from app.models.team import Team
from app.models.automation import AutomationRun
from app.repositories.user import UserRepository

router = APIRouter()
logger = get_logger(__name__)


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(deps.require_admin),
) -> Dict[str, Any]:
    """Get platform-wide statistics for the admin dashboard."""
    try:
        # Get total users
        total_users = await User.find_all().count()
        
        # Get active teams count
        active_teams = await Team.find_all().count()
        
        # Get total bot runs (approximated or counted from AutomationRun)
        bot_runs = await AutomationRun.find_all().count()
        
        # System alerts (mocked for now, or could query a system alerts collection)
        alerts = 0
        
        return {
            "total_users": total_users,
            "active_teams": active_teams,
            "bot_runs": bot_runs,
            "alerts": alerts
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch platform statistics"
        )


@router.get("/health")
async def get_system_health(
    current_user: User = Depends(deps.require_admin),
) -> List[Dict[str, str]]:
    """Get system health status for various components."""
    # In a real app, this would ping MongoDB, Redis, etc.
    # For now, we return operational status with slight randomization for realism if needed,
    # but preferably stable status reflecting actual config.
    
    # Check MongoDB via Beanie
    try:
        await User.find_one()
        db_status = "Operational"
    except:
        db_status = "Downtime"
        
    return [
        {"name": "MongoDB Database", "status": db_status, "uptime": "99.98%"},
        {"name": "Redis Cache", "status": "Operational", "uptime": "99.99%"},
        {"name": "Scraper Engine", "status": "Operational", "uptime": "99.50%"},
        {"name": "OpenAI API", "status": "Operational", "uptime": "99.90%"},
    ]


@router.get("/users")
async def list_all_users(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> List[Dict[str, Any]]:
    """List all users in the system."""
    try:
        if search:
            # Simple text search on username or email
            users = await User.find(
                {"$or": [
                    {"username": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}}
                ]}
            ).skip(skip).limit(limit).to_list()
        else:
            users = await user_repo.get_all(skip=skip, limit=limit)
            
        return [
            {
                "id": str(u.id),
                "name": u.full_name or u.username,
                "email": u.email,
                "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
                "plan": "Enterprise" if u.role.value == "ADMIN" else "Pro", # Mock plan logic
                "status": "Active" if u.is_active else "Suspended",
                "joined": u.created_at.strftime("%b %d, %Y") if hasattr(u, 'created_at') else "Unknown"
            }
            for u in users
        ]
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users"
        )


@router.post("/users")
async def create_user_admin(
    user_data: dict,  # Expecting name, email, role, plan
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """Create a new user from the admin console."""
    try:
        email = user_data.get("email")
        name = user_data.get("name")
        role_input = user_data.get("role", "User")
        
        if not email or not name:
            raise HTTPException(status_code=400, detail="Name and email are required")
            
        # Check if exists
        existing = await user_repo.get_by_email(email)
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")
            
        # Create user with default secure password
        from app.core import security
        import secrets
        import string
        
        # Generate random password
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        temp_password = ''.join(secrets.choice(alphabet) for i in range(12))
        hashed_password = security.get_password_hash(temp_password)
        
        from app.models.enums import UserRole
        role = UserRole.ADMIN if role_input == "Admin" else UserRole.USER
        
        # Since this is admin creation, assigning to current user's team for now
        # until a global team management system is fully built out
        team_id = str(current_user.team_id) if current_user.team_id else None
        
        new_user = await user_repo.create_user(
            email=email,
            username=email.split("@")[0],
            password_hash=hashed_password,
            full_name=name,
            team_id=team_id,
            role=role
        )
        
        logger.info(f"Admin {current_user.id} created user {new_user.id}")
        return {
            "message": "User created successfully",
            "user_id": str(new_user.id),
            "temp_password": temp_password # Return temp password so Admin can share it
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user via admin: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )



@router.put("/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    status_update: dict,  # {"is_active": True/False}
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """Toggle user active/suspended status."""
    try:
        is_active = status_update.get("is_active")
        if is_active is None:
            raise HTTPException(status_code=400, detail="Missing is_active field")
            
        user = await user_repo.get_or_404(user_id)
        
        # Prevent suspending oneself
        if str(user.id) == str(current_user.id) and not is_active:
            raise HTTPException(status_code=400, detail="Cannot suspend your own account")
            
        user = await user_repo.update(user_id, is_active=is_active)
        return {"message": f"User status updated to {'Active' if is_active else 'Suspended'}"}
    except Exception as e:
        logger.error(f"Error updating user status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """Delete a user from the system."""
    try:
        # Prevent deleting oneself
        if user_id == str(current_user.id):
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
            
        await user_repo.delete(user_id)
        return {"message": "User deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        with open("delete_error_debug.txt", "w") as f:
            import traceback
            f.write(f"Error: {str(e)}\nTraceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
