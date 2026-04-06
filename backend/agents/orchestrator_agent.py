import logging
from typing import Dict, Any

from app.services.job_scraper import job_scraper_service
from app.services.ai_service import ai_service
from app.services.automation_policy_service import automation_policy_service
from app.notifications.telegram import telegram_service
from app.core.config import settings
from app.models.user import User
from app.models.automation_event import AutomationEvent

from agents.decision_agent import DecisionAgent

logger = logging.getLogger(__name__)


class ResumeAgent:
    """Generates a tailored resume for a given job."""

    async def generate(self, job_description: str) -> str:
        logger.info("ResumeAgent crafting tailored resume...")
        return await ai_service.generate_resume_content(job_description)

    async def assess_ats(self, job_description: str, resume_text: str = "") -> Dict[str, Any]:
        """Generate ATS assessment metadata used as an auto-apply gate."""
        latex = await ai_service.generate_latex_resume(job_description, resume_text or None)
        return ai_service.score_latex_resume(job_description, latex)


class EmailAgent:
    """Handles emailing HR with tailored resumes."""

    async def send_application(self, company_name: str, tailored_resume: str) -> Dict[str, str]:
        logger.info(f"EmailAgent preparing transmission to {company_name}")
        # Simulates integration with sender/email modules while keeping orchestration focused.
        return {"status": "success", "company": company_name}

class OrchestratorAgent:
    """The chief controller tying the multi-agent job application process together."""
    
    def __init__(self, user: User):
        self.user = user
        self.decision_agent = DecisionAgent()
        self.resume_agent = ResumeAgent()
        self.email_agent = EmailAgent()
        self.ats_auto_apply_min_score = 78

    async def _log_event(
        self,
        *,
        stage: str,
        action: str,
        company: str | None = None,
        role: str | None = None,
        reason: str | None = None,
        ats_score: int | None = None,
        passes_gate: bool | None = None,
        override_used: bool = False,
        metadata: Dict[str, Any] | None = None,
    ) -> None:
        try:
            await AutomationEvent(
                user_id=str(self.user.id),
                source="orchestrator_agent",
                stage=stage,
                company=company,
                role=role,
                action=action,
                reason=reason,
                ats_score=ats_score,
                passes_gate=passes_gate,
                override_used=override_used,
                metadata=metadata or {},
            ).insert()
        except Exception as e:
            logger.warning(f"Failed to persist orchestrator automation event: {e}")

    async def run_pipeline(self, keyword: str, location: str, limit: int = 5, ats_override: bool = False) -> Dict[str, Any]:
        """Executes Scrape -> Decide -> Resume -> Email -> Notify"""
        logger.info(f"OrchestratorAgent starting multi-agent flow for {keyword} in {location}")
        
        # 1. Scrape Jobs (using existing service)
        scrape_result = await job_scraper_service.scrape_jobs(keyword, location, limit, str(self.user.id))
        jobs_found = scrape_result.get("jobs_found", 0)
        
        if jobs_found == 0:
            if settings.TELEGRAM_ENABLED and settings.TELEGRAM_BOT_TOKEN:
                await telegram_service.send_alert("Multi-Agent Orchestrator found no jobs.")
            return {"status": "completed", "applied": 0, "skipped": 0}

        applied_count = 0
        skipped_count = 0
        
        # 2. Phase 1: Formulate and Rank Jobs
        all_jobs = []
        for i in range(jobs_found):
            # Simulating fetched job properties from DB/Scraper
            job_mock = {
                "title": f"{keyword} Engineer",
                "company": f"Company {i}",
                "description": f"Looking for a {keyword} expert in {location}. Needs 2+ years of standard experience."
            }
            all_jobs.append(job_mock)
            
        # Extract successful patterns once
        from app.services.memory_service import memory_service
        successful_patterns = await memory_service.get_successful_patterns(str(self.user.id))
        
        # Score jobs (Skill match, Keywords, Past success are handled in `_rule_based_evaluate`)
        for job_mock in all_jobs:
            rule_result = self.decision_agent._rule_based_evaluate(job_mock, user_profile=keyword, successful_patterns=successful_patterns)
            job_mock["_score"] = rule_result.get("confidence", 0.0)
            
        # Efficient deterministic sort descending by score
        all_jobs.sort(key=lambda x: x["_score"], reverse=True)
        
        # Slice to the top N jobs
        top_jobs = all_jobs[:limit]
        logger.info(f"Orchestrator ranked {jobs_found} jobs. Proceeding to process {len(top_jobs)} targets.")
        
        # 3. Iterate and evaluate heavy targets
        for job_mock in top_jobs:
            logger.info(f"Processing ranked job {job_mock['company']} with base score {job_mock['_score']}")
            # Decision Agent step
            decision_result = await self.decision_agent.decide(job_mock, user_profile=keyword, user_id=str(self.user.id))
            decision = decision_result.get("decision", "skip")
            score = decision_result.get("confidence", 0.0)
            
            # Memory Logic
            from app.models.job_application import JobApplication
            from pymongo.errors import DuplicateKeyError
            
            job_app = JobApplication(
                company=job_mock["company"],
                role=job_mock["title"],
                decision=decision,
                score=score,
                status="evaluated",
                user_id=str(self.user.id)
            )
            
            try:
                await job_app.insert()
            except DuplicateKeyError:
                job_app = await JobApplication.find_one(
                    JobApplication.company == job_mock["company"],
                    JobApplication.role == job_mock["title"],
                    JobApplication.user_id == str(self.user.id)
                )

            if decision in ["skip", "maybe"]:
                logger.info(f"Orchestrator skipping {job_mock['company']}: {decision_result.get('reason')}")
                await self._log_event(
                    stage="decision",
                    action="skip",
                    company=job_mock.get("company"),
                    role=job_mock.get("title"),
                    reason=decision_result.get("reason"),
                    metadata={"decision": decision, "confidence": score},
                )
                skipped_count += 1
                if job_app:
                    job_app.status = "skipped"
                    await job_app.save()
                continue

            policy_allowed, policy_reason, policy_meta = await automation_policy_service.evaluate(
                user_id=str(self.user.id),
                company=job_mock.get("company", ""),
                role=job_mock.get("title", ""),
            )
            if not policy_allowed:
                logger.info(f"Orchestrator policy-gate skip for {job_mock['company']}: {policy_reason}")
                await self._log_event(
                    stage="policy_gate",
                    action="skip",
                    company=job_mock.get("company"),
                    role=job_mock.get("title"),
                    reason=policy_reason,
                    metadata=policy_meta,
                )
                skipped_count += 1
                if job_app:
                    job_app.status = "skipped"
                    await job_app.save()
                continue

            # ATS quality gate before auto-apply/email.
            ats_result = await self.resume_agent.assess_ats(job_mock["description"], resume_text=keyword)
            ats_score = int(ats_result.get("ats_score", 0))
            if (not ats_override) and (not bool(ats_result.get("passes_auto_gate")) or ats_score < self.ats_auto_apply_min_score):
                logger.info(
                    f"Orchestrator ATS-gate skip for {job_mock['company']}: "
                    f"score={ats_score}, pass={ats_result.get('passes_auto_gate')}"
                )
                await self._log_event(
                    stage="ats_gate",
                    action="skip",
                    company=job_mock.get("company"),
                    role=job_mock.get("title"),
                    reason="ATS gate failed",
                    ats_score=ats_score,
                    passes_gate=bool(ats_result.get("passes_auto_gate")),
                    override_used=ats_override,
                    metadata={"threshold": self.ats_auto_apply_min_score},
                )
                skipped_count += 1
                if job_app:
                    job_app.status = "skipped"
                    await job_app.save()
                continue

            if ats_override and (not bool(ats_result.get("passes_auto_gate")) or ats_score < self.ats_auto_apply_min_score):
                await self._log_event(
                    stage="ats_gate",
                    action="override",
                    company=job_mock.get("company"),
                    role=job_mock.get("title"),
                    reason="ATS gate bypassed by override",
                    ats_score=ats_score,
                    passes_gate=bool(ats_result.get("passes_auto_gate")),
                    override_used=True,
                    metadata={"threshold": self.ats_auto_apply_min_score},
                )
                
            # Resume Agent step
            resume = await self.resume_agent.generate(job_mock["description"])
            
            # Email Agent step
            await self.email_agent.send_application(job_mock["company"], resume)

            await self._log_event(
                stage="apply",
                action="applied",
                company=job_mock.get("company"),
                role=job_mock.get("title"),
                reason="Application workflow completed",
                ats_score=ats_score,
                passes_gate=bool(ats_result.get("passes_auto_gate")),
                override_used=ats_override,
            )
            
            if job_app:
                job_app.status = "applied"
                await job_app.save()
                
            applied_count += 1
            
        # 4. Final Notification
        summary = f"Multi-Agent pipeline completed. Evaluated: {jobs_found}, Applied: {applied_count}, Skipped: {skipped_count}"
        if settings.TELEGRAM_ENABLED and settings.TELEGRAM_BOT_TOKEN:
            await telegram_service.send_alert(summary)
            
        logger.info(summary)
        return {"status": "completed", "applied": applied_count, "skipped": skipped_count}
