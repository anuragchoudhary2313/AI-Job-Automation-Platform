from typing import Dict, List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def ai_match_jobs_tfidf(resume_text: str, jobs: List[Dict]) -> List[Dict]:
	"""Rank jobs using cosine similarity between resume and descriptions."""
	if not jobs:
		return []

	job_descriptions = [job.get("description", "") for job in jobs]
	documents = [resume_text] + job_descriptions

	tfidf_vectorizer = TfidfVectorizer(stop_words="english")
	tfidf_matrix = tfidf_vectorizer.fit_transform(documents)
	cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

	ranked_jobs = []
	for i, job in enumerate(jobs):
		job_with_score = job.copy()
		job_with_score["match_score"] = float(cosine_similarities[i])
		ranked_jobs.append(job_with_score)

	ranked_jobs.sort(key=lambda x: x["match_score"], reverse=True)
	return ranked_jobs


def ats_keyword_booster(resume_text: str, job_description: str) -> List[str]:
	"""Return likely missing job keywords from a resume."""
	job_words = set(job_description.lower().split())
	resume_words = set(resume_text.lower().split())

	missing_keywords = list(job_words - resume_words)
	stop_words = {"the", "and", "is", "in", "to", "for", "of", "a", "with"}
	missing_keywords = [w for w in missing_keywords if len(w) > 4 and w not in stop_words]

	return missing_keywords[:10]


def gpt_rewrite_bullets(bullets: List[str]) -> List[str]:
	"""Rewrite resume bullets with a placeholder GPT optimization."""
	return [f"Optimized: {bullet} (Measurable Impact Added)" for bullet in bullets]


def generate_cover_letter_gpt(resume_text: str, job_description: str) -> str:
	"""Generate a placeholder personalized cover letter."""
	return f"""
	Dear Hiring Manager,

	I am writing to express my interest in the position...
	Based on my experience: {resume_text[:50]}...
	I believe I am a great fit for: {job_description[:50]}...

	Sincerely,
	[Your Name]
	"""


__all__ = [
	"ai_match_jobs_tfidf",
	"ats_keyword_booster",
	"gpt_rewrite_bullets",
	"generate_cover_letter_gpt",
]
