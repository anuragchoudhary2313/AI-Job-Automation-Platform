import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1/ai"

def test_resume_bullets():
    print("Testing Resume Bullets Endpoint...")
    payload = {
        "bullet": "Managed a team of 5 people.",
        "job_description": "We are looking for a leader who can manage cross-functional teams and drive results."
    }
    try:
        response = requests.post(f"{BASE_URL}/resume/bullets", json=payload)
        if response.status_code == 200:
            result_text = response.json()
            if result_text and result_text != payload["bullet"]:
                print(f"✅ Success: Generated text differs from input.")
                print(f"   Input: {payload['bullet'][:50]}...")
                print(f"   Output: {result_text[:50]}...")
                return True
            else:
                print(f"⚠️ Warning: Output identical to input (Generation failed or fell back).")
                return False
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_cover_letter():
    print("\nTesting Cover Letter Endpoint...")
    payload = {
        "resume_summary": "Experienced software engineer with 5 years in Python and React.",
        "job_description": "Looking for a full-stack developer.",
        "company_name": "Tech Corp"
    }
    try:
        response = requests.post(f"{BASE_URL}/cover-letter", json=payload)
        if response.status_code == 200:
            result_text = response.json()
            if result_text and len(result_text) > 50: # Simple length check
                print(f"✅ Success: Generated cover letter.")
                print(f"   Output: {result_text[:50]}...")
                return True
            else:
                print(f"⚠️ Warning: Output suspicious (too short or empty).")
                return False
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_email():
    print("\nTesting Email Endpoint...")
    payload = {
        "template": "Hi, I am interested in the job.",
        "company_name": "Tech Corp",
        "role": "Developer"
    }
    try:
        response = requests.post(f"{BASE_URL}/email", json=payload)
        if response.status_code == 200:
            result_text = response.json()
            if result_text and result_text != payload["template"]:
                print(f"✅ Success: Generated email differs from template.")
                return True
            else:
                print(f"⚠️ Warning: Output identical to input.")
                return False
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    results = [test_resume_bullets(), test_cover_letter(), test_email()]
    if all(results):
        print("\n✅ All endpoints tested successfully.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed or returned static content.")
        sys.exit(1)
