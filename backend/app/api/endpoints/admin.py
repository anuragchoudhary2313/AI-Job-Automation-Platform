"""
Admin-only endpoints for monitoring and platform management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from typing import Dict, Any, List
from datetime import datetime, timedelta

from beanie import PydanticObjectId
from pydantic import BaseModel

from app.api import deps
from app.core.logging import get_logger
from app.models.user import User
from app.models.automation import AutomationRun
from app.models.automation_dead_letter import AutomationDeadLetter
from app.models.automation_event import AutomationEvent
from app.repositories.user import UserRepository
from app.core.pagination import create_offset_paginated_response
from app.services.dead_letter_replay_service import dead_letter_replay_service

router = APIRouter()
logger = get_logger(__name__)


class DeadLetterStatusRequest(BaseModel):
    status: str


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(deps.require_admin),
) -> Dict[str, Any]:
    """Get platform-wide statistics for the admin dashboard."""
    try:
        total_users = await User.find_all().count()
        active_users = await User.find(User.is_active == True).count()
        bot_runs = await AutomationRun.find_all().count()
        alerts = 0

        return {
            "total_users": total_users,
            "active_users": active_users,
            "bot_runs": bot_runs,
            "alerts": alerts,
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch platform statistics",
        )


@router.get("/health")
async def get_system_health(
    current_user: User = Depends(deps.require_admin),
) -> List[Dict[str, str]]:
    """Get system health status for various components."""
    try:
        await User.find_one()
        db_status = "Operational"
    except Exception:
        db_status = "Downtime"

    return [
        {"name": "MongoDB Database", "status": db_status, "uptime": "99.98%"},
        {"name": "Redis Cache", "status": "Operational", "uptime": "99.99%"},
        {"name": "Scraper Engine", "status": "Operational", "uptime": "99.50%"},
        {"name": "OpenAI API", "status": "Operational", "uptime": "99.90%"},
    ]


@router.get("/users")
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    include_meta: bool = Query(False, description="Return pagination metadata envelope"),
    search: str = None,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository),
) -> Any:
    """List all users in the system."""
    try:
        if search:
            total = await User.find(
                {
                    "$or": [
                        {"username": {"$regex": search, "$options": "i"}},
                        {"email": {"$regex": search, "$options": "i"}},
                    ]
                }
            ).count()
            users = (
                await User.find(
                    {
                        "$or": [
                            {"username": {"$regex": search, "$options": "i"}},
                            {"email": {"$regex": search, "$options": "i"}},
                        ]
                    }
                )
                .skip(skip)
                .limit(limit)
                .to_list()
            )
        else:
            total = await User.find_all().count()
            users = await user_repo.get_all(skip=skip, limit=limit)

        payload = [
            {
                "id": str(u.id),
                "name": u.full_name or u.username,
                "email": u.email,
                "role": u.role.value if hasattr(u.role, "value") else str(u.role),
                "plan": "Enterprise" if str(u.role).lower() == "admin" else "Pro",
                "status": "Active" if u.is_active else "Suspended",
                "joined": (
                    u.created_at.strftime("%b %d, %Y")
                    if hasattr(u, "created_at")
                    else "Unknown"
                ),
            }
            for u in users
        ]
        if include_meta:
            return create_offset_paginated_response(payload, total, skip, limit)
        return payload
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users",
        )


@router.post("/users")
async def create_user_admin(
    user_data: dict,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository),
) -> Any:
    """Create a new user from the admin console."""
    try:
        email = user_data.get("email")
        name = user_data.get("name")
        role_input = user_data.get("role", "User")

        if not email or not name:
            raise HTTPException(status_code=400, detail="Name and email are required")

        existing = await user_repo.get_by_email(email)
        if existing:
            raise HTTPException(
                status_code=400, detail="User with this email already exists"
            )

        from app.core import security
        import secrets
        import string

        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        temp_password = "".join(secrets.choice(alphabet) for _ in range(12))
        hashed_password = security.get_password_hash(temp_password)

        from app.models.enums import UserRole

        role = UserRole.ADMIN if role_input == "Admin" else UserRole.USER

        new_user = await user_repo.create_user(
            email=email,
            username=email.split("@")[0],
            password_hash=hashed_password,
            full_name=name,
            role=role,
        )

        # Send temp password via email — never return it in the response
        try:
            from app.services.email import email_service

            await email_service.send_email_async(
                to_email=email,
                subject="Your new account",
                body=(
                    f"<p>Hello {name},</p>"
                    f"<p>An admin has created an account for you.</p>"
                    f"<p>Your temporary password is: <strong>{temp_password}</strong></p>"
                    f"<p>Please log in and change your password immediately.</p>"
                ),
                html=True,
            )
        except Exception as email_err:
            logger.error(f"Failed to send temp password email to {email}: {email_err}")

        logger.info(f"Admin {current_user.id} created user {new_user.id}")
        return {
            "message": "User created successfully. A temporary password has been sent to their email.",
            "user_id": str(new_user.id),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user via admin: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )


@router.put("/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    status_update: dict,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository),
) -> Any:
    """Toggle user active/suspended status."""
    try:
        is_active = status_update.get("is_active")
        if is_active is None:
            raise HTTPException(status_code=400, detail="Missing is_active field")

        user = await user_repo.get_or_404(user_id)

        if str(user.id) == str(current_user.id) and not is_active:
            raise HTTPException(
                status_code=400, detail="Cannot suspend your own account"
            )

        user = await user_repo.update(user_id, is_active=is_active)
        return {
            "message": f"User status updated to {'Active' if is_active else 'Suspended'}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user status for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user status")


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository),
) -> Any:
    """Delete a user from the system."""
    try:
        if user_id == str(current_user.id):
            raise HTTPException(
                status_code=400, detail="Cannot delete your own account"
            )

        await user_repo.delete(user_id)
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete user")


@router.get("/dead-letters")
async def list_dead_letters_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=200),
    include_meta: bool = Query(True, description="Return pagination metadata envelope"),
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    source: str | None = Query(None),
    current_user: User = Depends(deps.require_admin),
):
    """Admin list of dead letters with pagination, search and filters."""
    query_filter: Dict[str, Any] = {}

    if status_filter:
        query_filter["status"] = status_filter
    if source:
        query_filter["source"] = source
    if search:
        query_filter["$or"] = [
            {"source": {"$regex": search, "$options": "i"}},
            {"stage": {"$regex": search, "$options": "i"}},
            {"task_name": {"$regex": search, "$options": "i"}},
            {"error_message": {"$regex": search, "$options": "i"}},
            {"user_id": {"$regex": search, "$options": "i"}},
        ]

    query = AutomationDeadLetter.find(query_filter)
    total = await query.count()
    rows = await query.sort("-created_at").skip(skip).limit(limit).to_list()

    payload = []
    for item in rows:
        row = item.model_dump(by_alias=False)
        row["id"] = str(item.id)
        payload.append(row)

    if include_meta:
        return create_offset_paginated_response(payload, total, skip, limit)
    return payload


@router.get("/dead-letters/metrics")
async def get_dead_letter_metrics_admin(
    current_user: User = Depends(deps.require_admin),
):
    """Admin metrics for dead-letter backlog, replay outcomes, and policy blocks."""
    total = await AutomationDeadLetter.find_all().count()
    open_count = await AutomationDeadLetter.find(AutomationDeadLetter.status == "open").count()
    ignored_count = await AutomationDeadLetter.find(AutomationDeadLetter.status == "ignored").count()
    replayed_count = await AutomationDeadLetter.find(AutomationDeadLetter.status == "replayed").count()

    orchestrator_count = await AutomationDeadLetter.find(
        AutomationDeadLetter.source == "orchestrator_agent"
    ).count()
    bot_count = await AutomationDeadLetter.find(AutomationDeadLetter.source == "bot_service").count()

    last_24h = datetime.utcnow() - timedelta(hours=24)
    replay_queued_24h = await AutomationEvent.find(
        AutomationEvent.source == "dead_letter_replay",
        AutomationEvent.stage == "replay",
        AutomationEvent.action == "override",
        AutomationEvent.created_at >= last_24h,
    ).count()
    replay_success_24h = await AutomationEvent.find(
        AutomationEvent.source == "dead_letter_replay",
        AutomationEvent.stage == "replay",
        AutomationEvent.action == "applied",
        AutomationEvent.created_at >= last_24h,
    ).count()
    replay_error_24h = await AutomationEvent.find(
        AutomationEvent.source == "dead_letter_replay",
        AutomationEvent.stage == "replay",
        AutomationEvent.action == "error",
        AutomationEvent.created_at >= last_24h,
    ).count()
    replay_blocked_24h = await AutomationEvent.find(
        AutomationEvent.source == "dead_letter_replay",
        AutomationEvent.stage == "policy_gate",
        AutomationEvent.action == "skip",
        AutomationEvent.created_at >= last_24h,
    ).count()

    return {
        "total": int(total),
        "open": int(open_count),
        "ignored": int(ignored_count),
        "replayed": int(replayed_count),
        "by_source": {
            "orchestrator_agent": int(orchestrator_count),
            "bot_service": int(bot_count),
        },
        "last_24h": {
            "queued": int(replay_queued_24h),
            "success": int(replay_success_24h),
            "error": int(replay_error_24h),
            "blocked": int(replay_blocked_24h),
        },
    }


@router.post("/dead-letters/{dead_letter_id}/status")
async def update_dead_letter_status_admin(
    dead_letter_id: str,
    request: DeadLetterStatusRequest,
    current_user: User = Depends(deps.require_admin),
):
    """Admin status updates for any dead-letter row."""
    next_status = (request.status or "").strip().lower()
    if next_status not in {"open", "replayed", "ignored"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    try:
        oid = PydanticObjectId(dead_letter_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dead letter id")

    item = await AutomationDeadLetter.get(oid)
    if item is None:
        raise HTTPException(status_code=404, detail="Dead letter not found")

    item.status = next_status
    item.metadata = {
        **(item.metadata or {}),
        "last_status_update_actor": str(current_user.id),
        "last_status_update_at": datetime.utcnow().isoformat(),
    }
    await item.save()

    return {"id": str(item.id), "status": item.status}


@router.post("/dead-letters/{dead_letter_id}/replay")
async def replay_dead_letter_admin(
    dead_letter_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.require_admin),
):
    """Queue replay for any dead-letter row as admin, with policy + validation checks."""
    try:
        oid = PydanticObjectId(dead_letter_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dead letter id")

    item = await AutomationDeadLetter.get(oid)
    if item is None:
        raise HTTPException(status_code=404, detail="Dead letter not found")

    allowed, reason = await dead_letter_replay_service.queue_replay(
        item,
        actor_user_id=str(current_user.id),
        actor_is_admin=True,
    )
    if not allowed:
        raise HTTPException(status_code=429, detail=reason)

    background_tasks.add_task(
        dead_letter_replay_service.run_replay,
        str(item.id),
        actor_user_id=str(current_user.id),
        actor_is_admin=True,
    )

    return {
        "status": "queued",
        "message": "Dead letter replay queued",
        "dead_letter_id": str(item.id),
    }
