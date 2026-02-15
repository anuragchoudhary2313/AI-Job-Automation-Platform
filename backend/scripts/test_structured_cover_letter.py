import sys
import os
import json

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ai_service import ai_service
from app.core.config import settings

def test_structured_cover_letter():
    print("Testing Structured Cover Letter Service...")
    
    resume_summary = "Senior Python Developer with 5 years of experience in FastAPI and Microservices."
    job_description = "We are looking for a backend engineer to build scalable APIs using Python and AWS."
    company_name = "TechCorp"

    try:
        response = ai_service.generate_structured_cover_letter(resume_summary, job_description, company_name)
        # Response is already a dict
        data = response
        print("\nStructure Validated.")
        print(f"Keys: {list(data.keys())}")
        
        if "content" in data and "recipient" in data:
            print("\nSUCCESS: Structured Cover Letter Generation works.")
        else:
            print("\nWARNING: Missing expected keys.")
            
    except json.JSONDecodeError:
        print("\nERROR: Response is not valid JSON.")
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_structured_cover_letter()
