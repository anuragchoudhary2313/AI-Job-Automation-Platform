"""
Team Isolation Tests
Tests for multi-tenant security and team data isolation.
"""
import pytest
from fastapi import status
from httpx import AsyncClient
from app.models.user import User
from app.models.team import Team
from app.models.job import Job
from app.models.enums import UserRole
from app.core import security

@pytest.mark.asyncio
class TestTeamIsolation:
    """Test that teams cannot access each other's data."""
    
    async def test_user_cannot_see_other_team_jobs(self, client: AsyncClient):
        """Test user cannot see jobs from another team."""
        # Create two teams
        team1 = Team(name="Team 1")
        team2 = Team(name="Team 2")
        await team1.insert()
        await team2.insert()
        
        # Create users in different teams
        user1 = User(
            username="user1",
            email="user1@example.com",
            password_hash=security.get_password_hash("pass123"),
            role=UserRole.USER,
            team_id=str(team1.id),
            is_active=True
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            password_hash=security.get_password_hash("pass123"),
            role=UserRole.USER,
            team_id=str(team2.id),
            is_active=True
        )
        await user1.insert()
        await user2.insert()
        
        # Create jobs for each team
        job1 = Job(title="Team 1 Job", company="Company 1", description="Desc", team_id=str(team1.id), user_id=str(user1.id))
        job2 = Job(title="Team 2 Job", company="Company 2", description="Desc", team_id=str(team2.id), user_id=str(user2.id))
        await job1.insert()
        await job2.insert()
        
        # User 1 should only see Team 1 jobs
        token1 = security.create_access_token(subject=str(user1.id))
        response = await client.get(
            "/api/v1/jobs",
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert response.status_code == status.HTTP_200_OK
        jobs = response.json()
        assert all(job["team_id"] == str(team1.id) for job in jobs)
        assert not any(job["team_id"] == str(team2.id) for job in jobs)
    
    async def test_user_cannot_access_other_team_job_by_id(self, client: AsyncClient):
        """Test user cannot access specific job from another team."""
        team1 = Team(name="Team 1")
        team2 = Team(name="Team 2")
        await team1.insert()
        await team2.insert()
        
        user = User(
            username="user",
            email="user@example.com",
            password_hash=security.get_password_hash("pass123"),
            role=UserRole.USER,
            team_id=str(team1.id),
            is_active=True
        )
        await user.insert()
        
        other_team_job = Job(title="Other Team Job", company="Company", description="Desc", team_id=str(team2.id), user_id="other_user")
        await other_team_job.insert()
        
        token = security.create_access_token(subject=str(user.id))
        response = await client.get(
            f"/api/v1/jobs/{other_team_job.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
class TestTeamManagement:
    """Test team creation and management."""
    
    async def test_create_team_on_registration(self, client: AsyncClient):
        """Test team is created when user registers."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser_team",
                "email": "teamuser@example.com",
                "password": "password123",
                "full_name": "Team User",
                "team_name": "My New Team"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        user_data = response.json()
        assert "team_id" in user_data
        assert user_data["team_id"] is not None
