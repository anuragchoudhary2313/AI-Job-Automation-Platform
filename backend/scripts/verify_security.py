import sys
import os
import requests
import time
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import settings

client = TestClient(app)

def verify_security_headers():
    print("Verifying Security Headers...")
    response = client.get("/")
    headers = response.headers
    
    expected_headers = {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Content-Security-Policy": None, # Just check presence
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": None # Just check presence
    }
    
    all_passed = True
    for header, value in expected_headers.items():
        if header not in headers:
            print(f"FAILED: Missing header {header}")
            all_passed = False
        elif value and headers[header] != value:
            print(f"FAILED: {header} value mismatch. Expected '{value}', got '{headers[header]}'")
            all_passed = False
        else:
            print(f"SUCCESS: {header} present.")
            
    if all_passed:
        print("\nAll Security Headers Verified.")
    else:
        print("\nSome Security Headers Missing/Incorrect.")

def verify_cors():
    print("\nVerifying CORS...")
    origin = "http://localhost:3000"
    # Try GET request with Origin header
    response = client.get(
        "/health",
        headers={"Origin": origin}
    )
    
    if "access-control-allow-origin" in response.headers:
        if response.headers["access-control-allow-origin"] == origin:
            print(f"SUCCESS: CORS allowed for {origin}")
        else:
            print(f"FAILED: CORS allowed origin mismatch: {response.headers['access-control-allow-origin']}")
    else:
        print(f"WARNING: CORS headers not present in response. Headers: {response.headers}")

def verify_rate_limiting():
    print("\nVerifying Rate Limiting...")
    if not settings.RATE_LIMIT_ENABLED:
        print("Rate limiting is disabled in settings. Skipping.")
        return

    print(f"Limit: {settings.RATE_LIMIT_CALLS} calls per {settings.RATE_LIMIT_PERIOD}s")
    
    # Target a non-exempt path (even 404 should be rate limited)
    path = "/api/v1/non-existent-endpoint-for-rate-limit"
    
    limit = settings.RATE_LIMIT_CALLS
    triggered = False
    
    start_time = time.time()
    for i in range(limit + 5):
        response = client.get(path)
        if response.status_code == 429:
            print(f"SUCCESS: Rate limit triggered after {i} requests.")
            triggered = True
            break
            
    if not triggered:
        print(f"FAILED: Rate limit NOT triggered after {limit + 5} requests.")
    else:
        print(f"Rate limit verification took {time.time() - start_time:.2f}s")

if __name__ == "__main__":
    verify_security_headers()
    verify_cors()
    verify_rate_limiting()
