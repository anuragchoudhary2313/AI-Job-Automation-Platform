import time
from typing import List, Dict

def scrape_jobs_from_naukri(keywords: str, location: str) -> List[Dict]:
    """
    Scrapes jobs from Naukri using provided keywords and location.
    """
    print(f"Scraping Naukri for {keywords} in {location}...")
    
    mock_jobs = [
        {
            "title": f"{keywords} Backend Dev",
            "company": "India Tech Pvt Ltd",
            "location": location,
            "description": "Python/Django developer needed...",
            "link": "https://naukri.com/jobs/view/101",
             "source": "naukri"
        }
    ]
    time.sleep(2)
    return mock_jobs
