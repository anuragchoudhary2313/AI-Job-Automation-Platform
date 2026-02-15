import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ai_service import ai_service
from app.core.config import settings

def test_ai():
    print("Testing Backend AI Service...")
    print(f"API Key Present: {bool(settings.GROQ_API_KEY)}")
    print(f"Model Fast: {settings.AI_MODEL_FAST}")
    
    # Test simple generation
    try:
        response = ai_service.generate_text("Say 'Backend Groq is working!'")
        print("\nResponse:")
        print(response)
        
        if "Groq is working" in response or "backend" in response.lower():
            print("\nSUCCESS: AI Service is connected.")
        else:
            print("\nWARNING: Response might be mock or unexpected.")
            
        print("\nTesting Resume Generation...")
        resume_response = ai_service.generate_resume_content("Software Engineer at Google")
        print(f"Resume Content Length: {len(resume_response)}")
        if len(resume_response) > 10:
             print("SUCCESS: Resume Generation works.")
            
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_ai()
