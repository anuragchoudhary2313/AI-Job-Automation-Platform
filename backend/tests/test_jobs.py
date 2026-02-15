"""
Job CRUD Tests
Tests for job creation, reading, updating, deletion, and filtering.
"""
import pytest
from fastapi import status
from httpx import AsyncClient
from app.models.job import Job, JobStatus
from app.models.user import User
from app.core.security import create_access_token

@pytest.mark.asyncio
class TestJobCreation:
    """Test job creation functionality."""
    
    async def test_create_job_authenticated(self, client: AsyncClient, auth_headers, test_team):
        """Test authenticated user can create a job."""
        response = await client.post(
            "/api/v1/jobs",
            headers=auth_headers,
            json={
                "title": "Senior Python Developer",
                "company": "Tech Corp",
                "description": "Looking for experienced Python developer",
                "hr_email": "hr@techcorp.com"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Senior Python Developer"
        assert data["company"] == "Tech Corp"
        assert data["status"] == JobStatus.PENDING
        assert data["team_id"] == str(test_team.id) or data["team_id"] == test_team.id
    
    async def test_create_job_unauthenticated(self, client: AsyncClient):
        """Test unauthenticated user cannot create a job."""
        response = await client.post(
            "/api/v1/jobs",
            json={"title": "Job", "company": "Company"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_create_job_missing_required_fields(self, client: AsyncClient, auth_headers):
        """Test job creation fails with missing required fields."""
        response = await client.post(
            "/api/v1/jobs",
            headers=auth_headers,
            json={"title": "Job"}  # Missing company
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
class TestJobRetrieval:
    """Test job retrieval functionality."""
    
    async def test_get_all_jobs(self, client: AsyncClient, auth_headers, test_team):
        """Test retrieving all jobs for a team."""
        # Create test jobs
        for i in range(3):
            job = Job(title=f"Job {i}", company=f"Company {i}", description="Desc", team_id=str(test_team.id), user_id="some_id")
            await job.insert()
        
        response = await client.get("/api/v1/jobs", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 3
    
    async def test_get_job_by_id(self, client: AsyncClient, auth_headers, test_team):
        """Test retrieving a specific job by ID."""
        job = Job(
            title="Specific Job",
            company="Specific Company",
            description="Test Description",
            team_id=str(test_team.id),
            user_id="some_id"
        )
        await job.insert()
        
        response = await client.get(f"/api/v1/jobs/{job.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(job.id)
        assert data["title"] == "Specific Job"
    
    async def test_get_nonexistent_job(self, client: AsyncClient, auth_headers):
        """Test retrieving non-existent job returns 404."""
        response = await client.get("/api/v1/jobs/60d5ecb8b392d40015f8c8d1", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
class TestJobUpdate:
    """Test job update functionality."""
    
    async def test_update_job(self, client: AsyncClient, auth_headers, test_team):
        """Test updating a job."""
        job = Job(title="Old Title", company="Company", description="Desc", team_id=str(test_team.id), user_id="some_id")
        await job.insert()
        
        response = await client.put(
            f"/api/v1/jobs/{job.id}",
            headers=auth_headers,
            json={
                "title": "New Title",
                "company": "New Company",
                "status": JobStatus.APPLIED
            }
        )
        # Assuming PUT is used for update
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "New Title"
        assert data["status"] == JobStatus.APPLIED


@pytest.mark.asyncio
class TestJobDeletion:
    """Test job deletion functionality."""
    
    async def test_delete_job(self, client: AsyncClient, auth_headers, test_team):
        """Test deleting a job."""
        job = Job(title="To Delete", company="Company", description="Desc", team_id=str(test_team.id), user_id="some_id")
        await job.insert()
        
        response = await client.delete(f"/api/v1/jobs/{job.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        
        # Verify job is deleted
        response = await client.get(f"/api/v1/jobs/{job.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND
