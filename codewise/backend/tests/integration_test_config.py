"""
Configuration for Integration Tests

These tests make real HTTP requests to a running API server.
Ensure the API is running before executing these tests.
"""

import os
from typing import Optional

# API Configuration
API_BASE_URL = os.getenv("TEST_API_BASE_URL", "http://localhost:8001")
API_V1_PREFIX = "/api/v1"

# Test Configuration
TEST_TIMEOUT = 30  # seconds
CLEANUP_AFTER_TESTS = True
VERBOSE_OUTPUT = True

# Database Configuration (for verification)
DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres123@localhost:5432/multitenancy_app"
)

# Endpoints
class Endpoints:
    """API endpoint paths"""
    REGISTER = f"{API_V1_PREFIX}/auth/register"
    LOGIN = f"{API_V1_PREFIX}/auth/login"
    LOGOUT = f"{API_V1_PREFIX}/auth/logout"
    ME = f"{API_V1_PREFIX}/users/me"
    ADD_MEMBER = f"{API_V1_PREFIX}/users/members"
    LIST_USERS = f"{API_V1_PREFIX}/users/"
    HEALTH = "/health"


def get_full_url(endpoint: str) -> str:
    """Get full URL for an endpoint"""
    return f"{API_BASE_URL}{endpoint}"


def print_test_info(message: str):
    """Print test information if verbose"""
    if VERBOSE_OUTPUT:
        print(f"\n{'='*60}")
        print(f"  {message}")
        print(f"{'='*60}")


# Test user data generators
def generate_unique_email(prefix: str = "test") -> str:
    """Generate unique email for testing"""
    import uuid
    return f"{prefix}+{uuid.uuid4().hex[:8]}@example.com"


def generate_test_user(user_type: str = "individual") -> dict:
    """Generate test user payload"""
    email = generate_unique_email(user_type)

    if user_type == "individual":
        return {
            "first_name": "Test",
            "last_name": "User",
            "email": email,
            "password": "SecurePass123!",
            "accept_terms": True
        }
    elif user_type == "organization":
        org_name = f"Test Org {email.split('@')[0]}"
        return {
            "first_name": "Admin",
            "last_name": "User",
            "email": email,
            "password": "SecurePass123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Test organization for integration testing",
                "industry": "Technology"
            }
        }
    else:
        raise ValueError(f"Unknown user type: {user_type}")
