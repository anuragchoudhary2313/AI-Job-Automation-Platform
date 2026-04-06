from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

from beanie import PydanticObjectId

from app.core.config import settings
from app.core.logging import get_logger
from app.models.automation_dead_letter import AutomationDeadLetter
from app.models.automation_event import AutomationEvent
from app.models.user import User
from app.services.bot import bot_service

logger = get_logger(__name__)


class DeadLetterReplayService:
    """Shared replay policy, payload validation, and replay execution for dead letters."""

    def _parse_iso(self, value: Any) -> Optional[datetime]:
        if not value or not isinstance(value, str):
            return None
        try:
            return datetime.fromisoformat(value)
        except Exception:
            return None

    def _backoff_seconds_for_attempt(self, attempts_in_window: int) -> int:
        base = max(1, int(settings.DEAD_LETTER_REPLAY_BACKOFF_BASE_SECONDS))
        max_seconds = max(base, int(settings.DEAD_LETTER_REPLAY_BACKOFF_MAX_SECONDS))
        exponent = max(0, attempts_in_window)
        return min(max_seconds, int(base * (2**exponent)))

    def validate_payload(
        self, dead_letter: AutomationDeadLetter
    ) -> Tuple[bool, str, Dict[str, Any]]:
        payload = dead_letter.payload or {}

        if dead_letter.source == "orchestrator_agent":
            if dead_letter.task_name != "multi_apply":
                return False, "Unsupported orchestrator task for replay", {}

            keyword = str(payload.get("keyword") or "").strip()
            location = str(payload.get("location") or "").strip()
            limit_raw = payload.get("limit", 5)
            ats_override = bool(payload.get("ats_override", False))

            try:
                limit = int(limit_raw)
            except Exception:
                return False, "Invalid payload: limit must be an integer", {}

            if not keyword:
                return False, "Invalid payload: keyword is required", {}
            if not location:
                return False, "Invalid payload: location is required", {}
            if limit < 1 or limit > 20:
                return False, "Invalid payload: limit must be between 1 and 20", {}

            return True, "valid", {
                "keyword": keyword,
                "location": location,
                "limit": limit,
                "ats_override": ats_override,
            }

        if dead_letter.source == "bot_service":
            user_id = str(dead_letter.user_id or payload.get("user_id") or "").strip()
            if not user_id:
                return False, "Invalid payload: user_id is required for bot replay", {}
            return True, "valid", {"user_id": user_id}

        return False, f"Unsupported dead-letter source: {dead_letter.source}", {}

    async def _insert_audit_event(
        self,
        *,
        target_user_id: str,
        action: str,
        stage: str,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        try:
            await AutomationEvent(
                user_id=target_user_id,
                source="dead_letter_replay",
                stage=stage,
                action=action,
                reason=reason,
                metadata=metadata or {},
            ).insert()
        except Exception as e:
            logger.warning(f"Failed to write dead-letter replay audit event: {e}")

    async def queue_replay(
        self,
        dead_letter: AutomationDeadLetter,
        *,
        actor_user_id: str,
        actor_is_admin: bool,
    ) -> Tuple[bool, str]:
        """Apply policy + validation and mark item queued when allowed."""
        is_valid, validation_reason, _ = self.validate_payload(dead_letter)
        if not is_valid:
            await self._insert_audit_event(
                target_user_id=str(dead_letter.user_id or actor_user_id),
                action="skip",
                stage="policy_gate",
                reason=f"Replay validation failed: {validation_reason}",
                metadata={
                    "dead_letter_id": str(dead_letter.id),
                    "source": dead_letter.source,
                    "task_name": dead_letter.task_name,
                    "actor_user_id": actor_user_id,
                    "actor_is_admin": actor_is_admin,
                },
            )
            return False, validation_reason

        now = datetime.utcnow()
        metadata = dict(dead_letter.metadata or {})
        window_start = self._parse_iso(metadata.get("replay_window_start_at"))
        last_requested = self._parse_iso(metadata.get("last_replay_requested_at"))
        attempts_in_window = int(metadata.get("replay_attempts_in_window") or 0)

        window_minutes = max(1, int(settings.DEAD_LETTER_REPLAY_WINDOW_MINUTES))
        window_delta = timedelta(minutes=window_minutes)
        if window_start is None or now - window_start > window_delta:
            window_start = now
            attempts_in_window = 0

        max_retries = max(1, int(settings.DEAD_LETTER_REPLAY_MAX_RETRIES))
        if attempts_in_window >= max_retries:
            await self._insert_audit_event(
                target_user_id=str(dead_letter.user_id or actor_user_id),
                action="skip",
                stage="policy_gate",
                reason="Replay blocked: max retries in active window reached",
                metadata={
                    "dead_letter_id": str(dead_letter.id),
                    "attempts_in_window": attempts_in_window,
                    "max_retries": max_retries,
                    "window_minutes": window_minutes,
                    "actor_user_id": actor_user_id,
                    "actor_is_admin": actor_is_admin,
                },
            )
            return False, "Replay blocked by policy: max retries in current window reached"

        required_backoff_seconds = self._backoff_seconds_for_attempt(attempts_in_window)
        if last_requested is not None and (now - last_requested).total_seconds() < required_backoff_seconds:
            remaining = int(required_backoff_seconds - (now - last_requested).total_seconds())
            await self._insert_audit_event(
                target_user_id=str(dead_letter.user_id or actor_user_id),
                action="skip",
                stage="policy_gate",
                reason="Replay blocked: exponential backoff not elapsed",
                metadata={
                    "dead_letter_id": str(dead_letter.id),
                    "required_backoff_seconds": required_backoff_seconds,
                    "retry_after_seconds": max(1, remaining),
                    "attempts_in_window": attempts_in_window,
                    "actor_user_id": actor_user_id,
                    "actor_is_admin": actor_is_admin,
                },
            )
            return False, f"Replay blocked by backoff policy. Retry after {max(1, remaining)}s"

        attempts_in_window += 1
        dead_letter.retry_count = int(dead_letter.retry_count or 0) + 1
        dead_letter.metadata = {
            **metadata,
            "replay_window_start_at": window_start.isoformat(),
            "replay_attempts_in_window": attempts_in_window,
            "last_replay_requested_at": now.isoformat(),
            "last_replay_status": "queued",
            "last_replay_actor_user_id": actor_user_id,
            "last_replay_actor_is_admin": actor_is_admin,
        }
        await dead_letter.save()

        await self._insert_audit_event(
            target_user_id=str(dead_letter.user_id or actor_user_id),
            action="override",
            stage="replay",
            reason="Dead letter replay requested",
            metadata={
                "dead_letter_id": str(dead_letter.id),
                "source": dead_letter.source,
                "task_name": dead_letter.task_name,
                "attempts_in_window": attempts_in_window,
                "actor_user_id": actor_user_id,
                "actor_is_admin": actor_is_admin,
            },
        )
        return True, "queued"

    async def run_replay(
        self,
        dead_letter_id: str,
        *,
        actor_user_id: str,
        actor_is_admin: bool,
    ) -> None:
        """Execute replay in background after queueing."""
        dead_letter = await AutomationDeadLetter.get(PydanticObjectId(dead_letter_id))
        if dead_letter is None:
            logger.warning(f"Dead letter not found for replay execution: {dead_letter_id}")
            return

        target_user_id = str(dead_letter.user_id or "")

        try:
            is_valid, validation_reason, normalized = self.validate_payload(dead_letter)
            if not is_valid:
                raise ValueError(validation_reason)

            if dead_letter.source == "orchestrator_agent":
                from agents.orchestrator_agent import OrchestratorAgent

                user = await User.get(PydanticObjectId(target_user_id))
                if user is None:
                    raise ValueError("Target user not found for orchestrator replay")

                orchestrator = OrchestratorAgent(user=user)
                await orchestrator.run_pipeline(
                    normalized["keyword"],
                    normalized["location"],
                    normalized["limit"],
                    ats_override=normalized["ats_override"],
                )
            elif dead_letter.source == "bot_service":
                await bot_service.run_job_automation(normalized["user_id"])
            else:
                raise ValueError(
                    f"Replay not supported for source={dead_letter.source} task={dead_letter.task_name}"
                )

            dead_letter.status = "replayed"
            dead_letter.metadata = {
                **(dead_letter.metadata or {}),
                "last_replay_finished_at": datetime.utcnow().isoformat(),
                "last_replay_status": "success",
            }
            await dead_letter.save()

            await self._insert_audit_event(
                target_user_id=target_user_id or actor_user_id,
                action="applied",
                stage="replay",
                reason="Dead letter replay completed",
                metadata={
                    "dead_letter_id": str(dead_letter.id),
                    "source": dead_letter.source,
                    "task_name": dead_letter.task_name,
                    "actor_user_id": actor_user_id,
                    "actor_is_admin": actor_is_admin,
                },
            )
        except Exception as e:
            logger.error(f"Dead letter replay failed for {dead_letter_id}: {e}", exc_info=True)
            dead_letter.status = "open"
            dead_letter.error_message = str(e)
            dead_letter.metadata = {
                **(dead_letter.metadata or {}),
                "last_replay_finished_at": datetime.utcnow().isoformat(),
                "last_replay_status": "failed",
                "last_replay_error": str(e),
            }
            await dead_letter.save()

            await self._insert_audit_event(
                target_user_id=target_user_id or actor_user_id,
                action="error",
                stage="replay",
                reason="Dead letter replay failed",
                metadata={
                    "dead_letter_id": str(dead_letter.id),
                    "error": str(e),
                    "actor_user_id": actor_user_id,
                    "actor_is_admin": actor_is_admin,
                },
            )


dead_letter_replay_service = DeadLetterReplayService()
