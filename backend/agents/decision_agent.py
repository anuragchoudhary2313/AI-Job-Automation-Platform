import logging
from typing import Dict, Any
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

class DecisionAgent:
    """Decides whether to apply or skip a job based on deterministic rules mapped to an AI classification system."""
    
    def __init__(self, use_ai: bool = True):
        self.use_ai = use_ai
        self.threshold: float = 0.6  # minimum confidence/score to automatically apply

    def _rule_based_evaluate(self, job: Dict[str, Any], user_profile: str, successful_patterns: list[str] = None) -> Dict[str, Any]:
        """Simple rule-based heuristic check enforcing safe string evaluation thresholds."""
        title = str(job.get("title", "")).lower()
        desc = str(job.get("description", "")).lower()
        profile_lower = user_profile.lower()
        
        score: float = 0.5  # Base score
        successful_patterns = successful_patterns or []
        pattern_match = sum(1 for pattern in successful_patterns if pattern in (title + " " + desc) and len(pattern) > 3)
        if pattern_match > 0:
            score += min(0.3, pattern_match * 0.15)
            logger.info(f"Memory Engine: Fired a +{min(0.3, pattern_match * 0.15)} confidence boost based on {pattern_match} historical success patterns.")

        # Hard exclusions
        if "senior" in title and "junior" in profile_lower:
            return {"decision": "skip", "confidence": 0.9, "reason": "Rule Skip: Seniority mismatch."}
            
        # Keyword matching scoring
        profile_skills = [s.strip() for s in profile_lower.replace(",", " ").split() if s.strip()]
        matches = sum(1 for skill in profile_skills if skill in desc)
        
        if len(profile_skills) > 0 and matches > 0:
            score_boost = min(0.4, (matches / max(1, len(profile_skills))) * 0.5)
            score += score_boost
            
        if score >= self.threshold:
            return {"decision": "apply", "confidence": round(score, 2), "reason": f"Rule Match: Found {matches} keyword skill overlaps."}
        elif score >= 0.4:
            return {"decision": "maybe", "confidence": round(score, 2), "reason": "Rule Match: Partial skill overlap, requires review."}
            
        return {"decision": "skip", "confidence": round((1.0 - score), 2), "reason": "Rule Skip: Match score below required thresholds."}

    async def decide(self, job: Dict[str, Any], user_profile: str = "", user_id: str = "") -> Dict[str, Any]:
        """
        Core decision engine matrix processing cascading rules safely defaulting to "skip".
        Returns: {"decision": "apply/skip/maybe", "confidence": float, "reason": str}
        """
        from app.services.memory_service import memory_service
        logger.info(f"Decision Engine analyzing job: {job.get('title')}")
        
        successful_patterns = await memory_service.get_successful_patterns(user_id) if user_id else []
        
        # 1. First Tier: Rule-based assessment
        rule_result = self._rule_based_evaluate(job, user_profile, successful_patterns)
        
        # Immediate hard rejection enforces safe defaults over skipping API loads
        if rule_result["decision"] == "skip" and rule_result["confidence"] > 0.8:
            logger.info(f"Decision Engine -> SKIP (Confidence: {rule_result['confidence']}, Reason: {rule_result['reason']})")
            return rule_result
            
        # 2. Second Tier: AI Assessment (escalates ambiguous rule matches)
        if self.use_ai:
            logger.info("Decision Engine -> Delegating classification to AI Assessor...")
            ai_result = await ai_service.evaluate_job_match(
                job_description=str(job.get("description", "")), 
                user_profile=user_profile
            )
            
            logger.info(f"Decision Engine AI -> {ai_result['decision'].upper()} (Confidence: {ai_result['confidence']})")
            
            # Extremely safe default fallback mapping for AI logic fractures
            if ai_result["decision"] not in ["apply", "skip", "maybe"]:
                ai_result["decision"] = "skip"
                
            return ai_result
            
        # 3. Fallback Tier
        logger.info(f"Decision Engine Fallback -> {rule_result['decision'].upper()} (Confidence: {rule_result['confidence']})")
        return rule_result
