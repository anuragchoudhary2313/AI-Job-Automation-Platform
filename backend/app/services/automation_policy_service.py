from datetime import datetime, timedelta
from typing import Any, Dict, Tuple

from app.core.config import settings
from app.models.automation_event import AutomationEvent
from app.models.job_application import JobApplication


class AutomationPolicyService:
    """Shared policy checks for auto-apply safety and deduplication."""

    async def evaluate(self, user_id: str, company: str, role: str) -> Tuple[bool, str, Dict[str, Any]]:
        now = datetime.utcnow()
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        normalized_company = (company or "").strip().lower()
        normalized_role = (role or "").strip().lower()

        blocked_companies = {name.strip().lower() for name in settings.AUTO_APPLY_BLOCKED_COMPANIES if name.strip()}
        if normalized_company in blocked_companies:
            return False, "Company is blocked by policy", {
                "policy": "blocked_company",
                "company": normalized_company,
            }

        applied_today = await AutomationEvent.find(
            AutomationEvent.user_id == str(user_id),
            AutomationEvent.action == "applied",
            AutomationEvent.created_at >= day_start,
        ).count()

        if applied_today >= settings.AUTO_APPLY_DAILY_CAP:
            return False, "Daily auto-apply cap reached", {
                "policy": "daily_cap",
                "applied_today": int(applied_today),
                "daily_cap": int(settings.AUTO_APPLY_DAILY_CAP),
            }

        dedup_since = now - timedelta(hours=max(1, int(settings.AUTO_APPLY_DEDUP_HOURS)))

        recent_applied_event = await AutomationEvent.find_one(
            AutomationEvent.user_id == str(user_id),
            AutomationEvent.action == "applied",
            AutomationEvent.company == company,
            AutomationEvent.role == role,
            AutomationEvent.created_at >= dedup_since,
        )
        if recent_applied_event is not None:
            return False, "Recent duplicate apply detected", {
                "policy": "dedup_recent_event",
                "dedup_hours": int(settings.AUTO_APPLY_DEDUP_HOURS),
            }

        existing_application = await JobApplication.find_one(
            JobApplication.user_id == str(user_id),
            JobApplication.company == company,
            JobApplication.role == role,
        )
        if existing_application is not None and (existing_application.status or "") in {
            "applied",
            "evaluated",
            "in_progress",
            "sent",
        }:
            return False, "Existing application record already present", {
                "policy": "dedup_job_application",
                "status": existing_application.status,
            }

        return True, "Policy check passed", {
            "policy": "pass",
            "applied_today": int(applied_today),
            "daily_cap": int(settings.AUTO_APPLY_DAILY_CAP),
            "dedup_hours": int(settings.AUTO_APPLY_DEDUP_HOURS),
        }


automation_policy_service = AutomationPolicyService()
