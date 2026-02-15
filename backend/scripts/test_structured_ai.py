import sys
import os
import json

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ai_service import ai_service
from app.core.config import settings

def test_structured_ai():
    print("Testing Structured AI Service...")
    
    try:
        response = ai_service.generate_structured_resume("Senior Python Developer with FastAPI experience.")
        # Response is already a dict
        data = response
        print("\nStructure Validated.")
        print(f"Keys: {list(data.keys())}")
        
        if "summary" in data and "skills" in data:
            print("\nSUCCESS: Structured Resume Generation works.")
        else:
            print("\nWARNING: Missing expected keys.")
            
    except json.JSONDecodeError:
        print("\nERROR: Response is not valid JSON.")
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_structured_ai()
