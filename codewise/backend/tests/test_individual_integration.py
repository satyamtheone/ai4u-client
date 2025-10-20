"""
Integration Tests for Individual User Registration

These tests make REAL HTTP requests to the running API server.
Ensure the API is running at http://localhost:8001 before executing.

Run tests:
    pytest tests/test_individual_integration.py -v -s
"""

import pytest
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from tests.integration_test_config import (
    get_full_url, Endpoints, generate_unique_email,
    TEST_TIMEOUT, DATABASE_URL, print_test_info
)
from models.user import User
from models.account_type import AccountType, AccountTypeEnum, UserRole
from models.role import Role


# Database session for verification
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Database session for verification"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestIndividualRegistrationIntegration:
    """Integration tests for individual user registration"""

    def test_register_individual_minimal_fields(self, db_session):
        """Test individual registration with minimal fields - REAL API CALL"""
        print_test_info("Testing Individual Registration - Minimal Fields")

        # Prepare payload
        email = generate_unique_email("individual_minimal")
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": email,
            "password": "SecurePass123!",
            "accept_terms": True
        }

        # Make REAL API call
        url = get_full_url(Endpoints.REGISTER)
        print(f"POST {url}")
        print(f"Payload: {payload}")

        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        # Verify response
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "User registered successfully"
        assert data["data"]["email"] == email
        assert data["data"]["first_name"] == "John"
        assert data["data"]["last_name"] == "Doe"

        # Verify in database
        user = db_session.query(User).filter(User.email == email).first()
        assert user is not None
        assert user.first_name == "John"
        assert user.last_name == "Doe"

        print("✓ Test passed - User created successfully")

    def test_register_individual_all_fields(self, db_session):
        """Test individual registration with all fields - REAL API CALL"""
        print_test_info("Testing Individual Registration - All Fields")

        email = generate_unique_email("individual_full")
        payload = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": email,
            "password": "AnotherSecure123!",
            "phone": "+1234567890",
            "account_type": "individual",
            "auth_method": "EMAIL",
            "accept_terms": True,
            "subscribe_newsletter": True,
            "timezone": "America/New_York",
            "locale": "en"
        }

        url = get_full_url(Endpoints.REGISTER)
        print(f"POST {url}")

        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == email
        assert data["data"]["phone"] == "+1234567890"
        assert data["data"]["timezone"] == "America/New_York"
        assert data["data"]["locale"] == "en"

        print("✓ Test passed - User with all fields created")

    def test_register_individual_account_type_verification(self, db_session):
        """Verify AccountType is created correctly - REAL API CALL + DB CHECK"""
        print_test_info("Testing AccountType Creation")

        email = generate_unique_email("account_type_test")
        payload = {
            "first_name": "Account",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        # Verify in database
        user = db_session.query(User).filter(User.email == email).first()
        assert user is not None

        account_type = db_session.query(AccountType).filter(
            AccountType.user_id == user.id
        ).first()

        assert account_type is not None
        assert account_type.account_type == AccountTypeEnum.INDIVIDUAL
        assert account_type.organization_id is None
        assert account_type.is_primary is True

        print("✓ AccountType verified correctly")

    def test_register_individual_role_assignment(self, db_session):
        """Verify role is assigned correctly - REAL API CALL + DB CHECK"""
        print_test_info("Testing Role Assignment")

        email = generate_unique_email("role_test")
        payload = {
            "first_name": "Role",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        # Verify role in database
        user = db_session.query(User).filter(User.email == email).first()
        role = db_session.query(Role).filter(Role.slug == "individual_user").first()
        user_role = db_session.query(UserRole).filter(
            UserRole.user_id == user.id
        ).first()

        assert user_role is not None
        assert user_role.role_id == role.id
        assert user_role.is_active is True

        print("✓ Role assigned correctly")


class TestIndividualRegistrationValidationIntegration:
    """Integration tests for validation errors"""

    def test_register_duplicate_email(self):
        """Test duplicate email rejection - REAL API CALLS"""
        print_test_info("Testing Duplicate Email Rejection")

        email = generate_unique_email("duplicate")
        payload = {
            "first_name": "First",
            "last_name": "User",
            "email": email,
            "password": "Password123!",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)

        # First registration
        print(f"First registration: {email}")
        response1 = requests.post(url, json=payload, timeout=TEST_TIMEOUT)
        assert response1.status_code == 200

        # Second registration with same email
        print(f"Second registration (duplicate): {email}")
        response2 = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response2.status_code}")
        assert response2.status_code == 400

        data = response2.json()
        assert "already exists" in data["detail"].lower()

        print("✓ Duplicate email correctly rejected")

    def test_register_invalid_email(self):
        """Test invalid email format - REAL API CALL"""
        print_test_info("Testing Invalid Email Validation")

        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "not-an-email",
            "password": "Password123!",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 422

        print("✓ Invalid email rejected")

    def test_register_weak_password(self):
        """Test weak password rejection - REAL API CALL"""
        print_test_info("Testing Weak Password Validation")

        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": generate_unique_email("weak_pass"),
            "password": "short",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 422

        print("✓ Weak password rejected")

    def test_register_missing_required_fields(self):
        """Test missing required fields - REAL API CALL"""
        print_test_info("Testing Missing Required Fields")

        payload = {
            "email": "incomplete@example.com"
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 422

        print("✓ Missing fields rejected")


class TestIndividualRegistrationEdgeCasesIntegration:
    """Integration tests for edge cases"""

    def test_register_email_case_insensitive(self, db_session):
        """Test email is stored in lowercase - REAL API CALL + DB CHECK"""
        print_test_info("Testing Email Case Insensitivity")

        unique_suffix = generate_unique_email("case_test").split('@')[0]
        email = f"{unique_suffix}@EXAMPLE.COM"

        payload = {
            "first_name": "Case",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        # Verify in database - email should be lowercase
        user = db_session.query(User).filter(
            User.email == email.lower()
        ).first()

        assert user is not None
        assert user.email == email.lower()

        print("✓ Email stored in lowercase")

    def test_register_special_characters_in_name(self):
        """Test special characters in names - REAL API CALL"""
        print_test_info("Testing Special Characters in Names")

        payload = {
            "first_name": "Jean-Pierre",
            "last_name": "O'Brien",
            "email": generate_unique_email("special_chars"),
            "password": "Password123!",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["first_name"] == "Jean-Pierre"
        assert data["data"]["last_name"] == "O'Brien"

        print("✓ Special characters accepted")

    def test_register_unicode_characters(self):
        """Test unicode characters in names - REAL API CALL"""
        print_test_info("Testing Unicode Characters")

        payload = {
            "first_name": "José",
            "last_name": "Müller",
            "email": generate_unique_email("unicode"),
            "password": "Password123!",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["first_name"] == "José"
        assert data["data"]["last_name"] == "Müller"

        print("✓ Unicode characters accepted")

    def test_register_default_values(self):
        """Test default values are applied - REAL API CALL"""
        print_test_info("Testing Default Values")

        payload = {
            "first_name": "Default",
            "last_name": "User",
            "email": generate_unique_email("defaults"),
            "password": "Password123!",
            "accept_terms": True
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200
        data = response.json()["data"]

        assert data["timezone"] == "UTC"
        assert data["locale"] == "en"
        assert data["subscribe_newsletter"] is False
        assert data["auth_method"] == "email"
        assert data["is_active"] is True
        assert data["is_email_verified"] is False

        print("✓ Default values correctly applied")
