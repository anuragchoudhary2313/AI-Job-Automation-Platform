import sys
import os
import logging

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.exceptions import NotFoundError, AuthorizationError, AppException

# Disable logging for cleaner output
logging.getLogger("app.core.error_handlers").setLevel(logging.CRITICAL)

client = TestClient(app)

def test_error_handlers():
    print("Testing Centralized Error Handlers...")
    
    # Inject temporary routes for testing
    @app.get("/test/error/not-found")
    def raise_not_found():
        raise NotFoundError(resource="TestResource", identifier="123")

    @app.get("/test/error/auth")
    def raise_auth_error():
        raise AuthorizationError("You shall not pass!")

    @app.get("/test/error/generic")
    def raise_generic_app_error():
        raise AppException("Something went wrong", status_code=418, details={"reason": "Teapot"})

    # Test 404
    print("\nTesting NotFoundError (404)...")
    response_404 = client.get("/test/error/not-found")
    print(f"Status: {response_404.status_code}")
    print(f"Body: {response_404.json()}")
    assert response_404.status_code == 404
    assert response_404.json()["error"] == "TestResource with identifier '123' not found"
    print("SUCCESS: 404 handled correctly.")

    # Test 403
    print("\nTesting AuthorizationError (403)...")
    response_403 = client.get("/test/error/auth")
    print(f"Status: {response_403.status_code}")
    print(f"Body: {response_403.json()}")
    assert response_403.status_code == 403
    assert response_403.json()["error"] == "You shall not pass!"
    print("SUCCESS: 403 handled correctly.")

    # Test Custom App Exception
    print("\nTesting Generic AppException (418)...")
    response_418 = client.get("/test/error/generic")
    print(f"Status: {response_418.status_code}")
    print(f"Body: {response_418.json()}")
    assert response_418.status_code == 418
    assert response_418.json()["details"]["reason"] == "Teapot"
    print("SUCCESS: Custom exception handled correctly.")

if __name__ == "__main__":
    try:
        test_error_handlers()
        print("\nALL TESTS PASSED")
    except AssertionError as e:
        print(f"\nFAILED: {e}")
    except Exception as e:
        print(f"\nERROR: {e}")
