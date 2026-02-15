import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.main import app
from app.core.config import settings
from app.models.user import User
from app.models.team import Team
from app.models.enums import UserRole
from app.core import security

# Mock password hashing for faster tests
def mock_get_password_hash(password: str) -> str:
    return f"hashed_{password}"

def mock_verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashed_password == f"hashed_{plain_password}"

@pytest.fixture(autouse=True)
def patch_security(monkeypatch):
    """Globally patch security functions for tests."""
    monkeypatch.setattr("app.core.security.get_password_hash", mock_get_password_hash)
    monkeypatch.setattr("app.core.security.verify_password", mock_verify_password)

# event_loop fixture removed - handled automatically by pytest-asyncio


@pytest.fixture
async def init_test_db():
    """Initialize test database."""
    # Use a unique database name for this test run to avoid collisions
    test_db_name = "test_db_" + settings.MONGODB_DB_NAME
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[test_db_name]
    
    from app.models.user import User
    from app.models.job import Job, ScrapedJob
    from app.models.resume import Resume
    from app.models.team import Team
    from app.models.automation import AutomationRun
    from app.models.match import Match
    from app.models.log import AgentLog, Log
    
    await init_beanie(
        database=db,
        document_models=[
            User,
            Job,
            ScrapedJob,
            Resume,
            Team,
            AutomationRun,
            Match,
            AgentLog,
            Log
        ]
    )
    
    yield db
    # We do NOT drop the database here as it causes NamespaceNotFound in rapid async tests
    # But we close the client
    client.close()

@pytest.fixture(autouse=True)
async def clean_db(init_test_db):
    """Clean database before each test."""
    from app.models.user import User
    from app.models.job import Job, ScrapedJob
    from app.models.resume import Resume
    from app.models.team import Team
    from app.models.automation import AutomationRun
    from app.models.match import Match
    from app.models.log import AgentLog, Log
    
    await User.find_all().delete()
    await Job.find_all().delete()
    await ScrapedJob.find_all().delete()
    await Resume.find_all().delete()
    await Team.find_all().delete()
    await AutomationRun.find_all().delete()
    await Match.find_all().delete()
    await AgentLog.find_all().delete()
    await Log.find_all().delete()
    yield

@pytest.fixture
async def client(init_test_db) -> AsyncGenerator[AsyncClient, None]:
    """Async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def test_team(init_test_db):
    """Create a test team."""
    team = Team(name="Test Team")
    await team.insert()
    return team

@pytest.fixture
async def test_user(test_team):
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=security.get_password_hash("testpassword123"),
        role=UserRole.USER,
        team_id=str(test_team.id),
        is_active=True
    )
    await user.insert()
    return user

@pytest.fixture
async def test_admin(test_team):
    """Create a test admin user."""
    admin = User(
        username="admin",
        email="admin@example.com",
        password_hash=security.get_password_hash("adminpass123"),
        role=UserRole.ADMIN,
        team_id=str(test_team.id),
        is_active=True
    )
    await admin.insert()
    return admin

@pytest.fixture
async def user_token(test_user):
    """Generate JWT token for test user."""
    return security.create_access_token(subject=str(test_user.id))

@pytest.fixture
async def admin_token(test_admin):
    """Generate JWT token for admin user."""
    return security.create_access_token(subject=str(test_admin.id))

@pytest.fixture
async def auth_headers(test_user):
    """Create authorization headers for test user."""
    token = security.create_access_token(subject=str(test_user.id))
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def admin_headers(test_admin):
    """Create authorization headers for admin user."""
    token = security.create_access_token(subject=str(test_admin.id))
    return {"Authorization": f"Bearer {token}"}
