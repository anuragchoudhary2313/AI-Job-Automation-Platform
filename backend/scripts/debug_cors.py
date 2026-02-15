import sys
import os
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def debug_cors():
    print("Debugging CORS...")
    origin = "http://localhost:3000"
    headers = {"Origin": origin}
    
    print(f"Sending GET /health with Origin: {origin}")
    response = client.get("/health", headers=headers)
    
    print(f"Status: {response.status_code}")
    print("Response Headers:")
    for k, v in response.headers.items():
        print(f"  {k}: {v}")
        
    if "access-control-allow-origin" in response.headers:
        print("\nCORS header FOUND!")
    else:
        print("\nCORS header MISSING!")

if __name__ == "__main__":
    debug_cors()
