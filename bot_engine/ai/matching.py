from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict

def ai_match_jobs_tfidf(resume_text: str, jobs: List[Dict]) -> List[Dict]:
    """
    Ranks jobs based on cosine similarity between resume text and job descriptions.
    """
    if not jobs:
        return []

    job_descriptions = [job.get('description', '') for job in jobs]
    documents = [resume_text] + job_descriptions
    
    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf_vectorizer.fit_transform(documents)
    
    # Calculate similarity between resume (index 0) and all jobs (index 1 to end)
    cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    
    ranked_jobs = []
    for i, job in enumerate(jobs):
        job_with_score = job.copy()
        job_with_score['match_score'] = float(cosine_similarities[i])
        ranked_jobs.append(job_with_score)
    
    # Sort by match score descending
    ranked_jobs.sort(key=lambda x: x['match_score'], reverse=True)
    return ranked_jobs

def ats_keyword_booster(resume_text: str, job_description: str) -> List[str]:
    """
    Identifies keywords present in job description but missing in resume.
    Simple implementation: extracts nouns/entities (mocked logic or basic text set)
    """
    # Placeholder: In production, use spaCy or NLTK
    job_words = set(job_description.lower().split())
    resume_words = set(resume_text.lower().split())
    
    missing_keywords = list(job_words - resume_words)
    # Filter common words (very basic stopword removal)
    stop_words = {"the", "and", "is", "in", "to", "for", "of", "a", "with"}
    missing_keywords = [w for w in missing_keywords if len(w) > 4 and w not in stop_words]
    
    return missing_keywords[:10] # Return top 10 potential keywords
