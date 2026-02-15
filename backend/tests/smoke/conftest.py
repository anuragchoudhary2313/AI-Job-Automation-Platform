"""
Pytest configuration for smoke tests.
"""

import pytest


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "smoke: mark test as a smoke test"
    )
    config.addinivalue_line(
        "markers", "critical: mark test as critical flow"
    )


@pytest.fixture(scope="session")
def base_url():
    """Base URL for API."""
    return "http://localhost:8000"


@pytest.fixture(scope="session")
def api_url(base_url):
    """API v1 URL."""
    return f"{base_url}/api/v1"
