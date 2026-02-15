"""
Authentication Tests
Tests for user registration, login, JWT token generation, and role-based access.
"""
import pytest
from fastapi import status
from httpx import AsyncClient
from app.models.user import User
from app.models.enums import UserRole
from app.core import security
@pytest.mark.asyncio
class TestUserRegistration:
    """Test user registration functionality."""
    
    async def test_register_new_user(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "securepass123",
                "full_name": "New User",
                "team_name": "New Team"
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert "password" not in data
    
    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        """Test registration with existing email fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "another",
                "email": test_user.email,
                "password": "password123",
                "full_name": "Another User",
                "team_name": "Team"
            }
        )
        assert response.status_code == status.HTTP_409_CONFLICT
        assert "already exists" in response.json()["detail"]["message"].lower() # Adjusted for central error handler
    
    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email format."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "user",
                "email": "invalid-email",
                "password": "pass123",
                "full_name": "User",
                "team_name": "Team"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_register_weak_password(self, client: AsyncClient):
        """Test registration with weak password."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "user",
                "email": "user@example.com",
                "password": "123",  # Too short
                "full_name": "User",
                "team_name": "Team"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestUserLogin:
    """Test user login functionality."""
    
    async def test_login_success(self, client: AsyncClient, test_user):
        """Test successful login with correct credentials."""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user.email, # Login uses email as username in OAuth2PasswordRequestForm
                "password": "testpassword123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        """Test login fails with incorrect password."""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user.email,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED # Changed to 401
    
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login fails for non-existent user."""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_login_missing_credentials(self, client: AsyncClient):
        """Test login fails with missing credentials."""
        response = await client.post("/api/v1/auth/login", data={})
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestJWTTokens:
    """Test JWT token generation and validation."""
    
    async def test_token_contains_user_info(self, user_token):
        """Test JWT token contains correct user information."""
        from jose import jwt
        from app.core.config import settings
        
        payload = jwt.decode(user_token, settings.SECRET_KEY, algorithms=["HS256"])
        assert "sub" in payload
        assert "exp" in payload
    
    async def test_access_protected_endpoint_with_token(self, client: AsyncClient, auth_headers):
        """Test accessing protected endpoint with valid token."""
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
    
    async def test_access_protected_endpoint_without_token(self, client: AsyncClient):
        """Test accessing protected endpoint without token fails."""
        response = await client.get("/api/v1/users/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_access_with_invalid_token(self, client: AsyncClient):
        """Test accessing protected endpoint with invalid token fails."""
        response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_token_expiration(self, client: AsyncClient, test_user):
        """Test that expired tokens are rejected."""
        from datetime import timedelta
        from app.core.security import create_access_token
        
        # Create expired token
        expired_token = create_access_token(
            subject=str(test_user.id),
            expires_delta=timedelta(minutes=-1)
        )
        
        response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestRoleBasedAccess:
    """Test role-based access control."""
    
    async def test_admin_can_access_admin_endpoint(self, client: AsyncClient, admin_headers):
        """Test admin can access admin-only endpoints."""
        response = await client.get("/api/v1/admin/users", headers=admin_headers) # Admin can list users
        assert response.status_code == status.HTTP_200_OK
    
    async def test_member_cannot_access_admin_endpoint(self, client: AsyncClient, auth_headers):
        """Test regular member cannot access admin endpoints."""
        response = await client.get("/api/v1/admin/users", headers=auth_headers)
        # Assuming only admin can list all users
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestPasswordSecurity:
    """Test password hashing and security."""
    
    async def test_password_is_hashed(self, test_user):
        """Test password is stored as hash, not plaintext."""
        assert test_user.password_hash != "testpassword123"
        assert len(test_user.password_hash) > 10  # Mock hash is shorter but not plaintext
    
    async def test_password_verification(self):
        """Test password verification works correctly."""
        from app.core.security import get_password_hash, verify_password
        
        password = "mysecretpassword"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)
