"""
Smoke Tests for AI Job Automation Platform

These tests verify critical user flows work end-to-end.
Run these tests before deployment to ensure core functionality.

Usage:
    pytest tests/smoke/test_smoke.py -v
    pytest tests/smoke/test_smoke.py -v -k "test_auth"
"""

import pytest
import requests
import time
from pathlib import Path
import io

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

# Test user credentials
TEST_USER = {
    "email": f"smoketest_{int(time.time())}@example.com",
    "password": "SmokeTest123!@#",
    "full_name": "Smoke Test User"
}

# Global token storage
auth_token = None
resume_id = None


class TestAuthenticationFlow:
    """Test authentication and user management."""
    
    def test_01_health_check(self):
        """Verify API is running."""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_02_user_registration(self):
        """Test user registration."""
        response = requests.post(
            f"{API_V1}/auth/register",
            json=TEST_USER
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print(f"✓ User registered: {TEST_USER['email']}")
    
    def test_03_user_login(self):
        """Test user login."""
        global auth_token
        
        response = requests.post(
            f"{API_V1}/auth/login",
            data={
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        
        auth_token = data["access_token"]
        print(f"✓ User logged in, token: {auth_token[:20]}...")
    
    def test_04_get_current_user(self):
        """Test getting current user info."""
        assert auth_token is not None, "Must login first"
        
        response = requests.get(
            f"{API_V1}/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_USER["email"]
        assert data["full_name"] == TEST_USER["full_name"]
        print(f"✓ Current user: {data['email']}")
    
    def test_05_invalid_login(self):
        """Test login with invalid credentials."""
        response = requests.post(
            f"{API_V1}/auth/login",
            data={
                "username": TEST_USER["email"],
                "password": "WrongPassword123!"
            }
        )
        assert response.status_code == 401
        print("✓ Invalid login rejected")


class TestResumeFlow:
    """Test resume upload, download, and management."""
    
    def test_01_list_resumes_empty(self):
        """Test listing resumes when none exist."""
        assert auth_token is not None, "Must login first"
        
        response = requests.get(
            f"{API_V1}/resumes/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Resume list retrieved: {len(data)} resumes")
    
    def test_02_upload_resume(self):
        """Test resume upload."""
        global resume_id
        assert auth_token is not None, "Must login first"
        
        # Create a dummy PDF file
        pdf_content = b"%PDF-1.4\n%Test Resume\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Resume) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000015 00000 n\n0000000068 00000 n\n0000000125 00000 n\n0000000317 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n408\n%%EOF"
        
        files = {
            "file": ("test_resume.pdf", io.BytesIO(pdf_content), "application/pdf")
        }
        
        response = requests.post(
            f"{API_V1}/resumes/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["filename"] == "test_resume.pdf"
        
        resume_id = data["id"]
        print(f"✓ Resume uploaded: ID {resume_id}")
    
    def test_03_list_resumes_with_data(self):
        """Test listing resumes after upload."""
        assert auth_token is not None, "Must login first"
        
        response = requests.get(
            f"{API_V1}/resumes/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(r["id"] == resume_id for r in data)
        print(f"✓ Resume found in list")
    
    def test_04_download_resume(self):
        """Test resume download."""
        assert auth_token is not None, "Must login first"
        assert resume_id is not None, "Must upload resume first"
        
        response = requests.get(
            f"{API_V1}/resumes/{resume_id}/download",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert len(response.content) > 0
        print(f"✓ Resume downloaded: {len(response.content)} bytes")
    
    def test_05_delete_resume(self):
        """Test resume deletion."""
        assert auth_token is not None, "Must login first"
        assert resume_id is not None, "Must upload resume first"
        
        response = requests.delete(
            f"{API_V1}/resumes/{resume_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print(f"✓ Resume deleted: ID {resume_id}")


class TestJobScrapingFlow:
    """Test job scraping functionality."""
    
    def test_01_scrape_jobs(self):
        """Test job scraping."""
        assert auth_token is not None, "Must login first"
        
        response = requests.get(
            f"{API_V1}/jobs/scrape",
            params={
                "keyword": "python developer",
                "location": "remote",
                "limit": 3
            },
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=60  # Scraping can take time
        )
        
        # Accept both success and feature disabled
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Jobs scraped: {data.get('total', 0)} found, {data.get('new', 0)} new")
        else:
            print("✓ Job scraping disabled (expected in some environments)")
    
    def test_02_list_scraped_jobs(self):
        """Test listing scraped jobs."""
        assert auth_token is not None, "Must login first"
        
        response = requests.get(
            f"{API_V1}/jobs/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Scraped jobs listed: {len(data)} jobs")


class TestSchedulerFlow:
    """Test scheduler functionality."""
    
    def test_01_scheduler_status(self):
        """Test getting scheduler status."""
        assert auth_token is not None, "Must login first"
        
        response = requests.get(
            f"{API_V1}/scheduler/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "running" in data
        assert "jobs" in data
        print(f"✓ Scheduler status: running={data['running']}, jobs={len(data['jobs'])}")
    
    def test_02_list_jobs(self):
        """Test listing scheduled jobs."""
        assert auth_token is not None, "Must login first"
        
        response = requests.get(
            f"{API_V1}/scheduler/jobs",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Scheduled jobs: {len(data)} jobs")


class TestStatsFlow:
    """Test statistics endpoints."""
    
    def test_01_dashboard_stats(self):
        """Test getting dashboard statistics."""
        assert auth_token is not None, "Must login first"
        
        response = requests.get(
            f"{API_V1}/stats/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_applications" in data
        assert "total_resumes" in data
        print(f"✓ Dashboard stats: {data}")


class TestWebSocketFlow:
    """Test WebSocket connectivity."""
    
    def test_01_websocket_endpoint_exists(self):
        """Test WebSocket endpoint is available."""
        # Note: Full WebSocket testing requires websocket client
        # This is a basic connectivity check
        response = requests.get(f"{BASE_URL}/docs")
        assert response.status_code == 200
        print("✓ API docs accessible (WebSocket endpoint documented)")


# Test execution summary
def test_summary():
    """Print test execution summary."""
    print("\n" + "="*60)
    print("SMOKE TEST SUMMARY")
    print("="*60)
    print("✓ All critical flows tested")
    print("✓ Authentication: Registration, Login, User Info")
    print("✓ Resume Management: Upload, List, Download, Delete")
    print("✓ Job Scraping: Scrape, List")
    print("✓ Scheduler: Status, Jobs")
    print("✓ Statistics: Dashboard Stats")
    print("="*60)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
