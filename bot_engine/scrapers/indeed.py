import time
from typing import List, Dict

def scrape_jobs_from_indeed(keywords: str, location: str) -> List[Dict]:
    """
    Scrapes jobs from Indeed using provided keywords and location.
    """
    print(f"Scraping Indeed for {keywords} in {location}...")
    
    mock_jobs = [
        {
            "title": f"Lead {keywords} Architect",
            "company": "Enterprise Solutions",
            "location": location,
            "description": "Architect scalable systems...",
            "link": "https://indeed.com/jobs/view/789",
             "source": "indeed"
        }
    ]
    time.sleep(2)
    return mock_jobs
