"""
Integration Tests for Organization Admin Registration

These tests make REAL HTTP requests to the running API server.
Ensure the API is running at http://localhost:8001 before executing.

Run tests:
    pytest tests/test_organization_integration.py -v -s
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
from models.organization import Organization
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


class TestOrganizationRegistrationIntegration:
    """Integration tests for organization admin registration"""

    def test_register_organization_minimal_fields(self, db_session):
        """Test organization registration with minimal fields - REAL API CALL"""
        print_test_info("Testing Organization Registration - Minimal Fields")

        email = generate_unique_email("org_minimal")
        org_name = f"Test Org Minimal {email.split('@')[0]}"

        payload = {
            "first_name": "Admin",
            "last_name": "User",
            "email": email,
            "password": "SecurePass123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Test organization",
                "industry": "Technology"
            }
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
        assert data["data"]["first_name"] == "Admin"
        assert data["data"]["last_name"] == "User"

        # Verify user in database
        user = db_session.query(User).filter(User.email == email).first()
        assert user is not None
        assert user.first_name == "Admin"
        assert user.last_name == "User"

        # Verify organization in database
        org = db_session.query(Organization).filter(Organization.name == org_name).first()
        assert org is not None
        assert org.description == "Test organization"
        assert org.industry == "Technology"
        assert org.created_by == user.id

        print("✓ Test passed - Organization and admin user created successfully")

    def test_register_organization_all_fields(self, db_session):
        """Test organization registration with all fields - REAL API CALL"""
        print_test_info("Testing Organization Registration - All Fields")

        email = generate_unique_email("org_full")
        org_name = f"Tech Corporation {email.split('@')[0]}"

        payload = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": email,
            "password": "AnotherSecure123!",
            "phone": "+1234567890",
            "accept_terms": True,
            "subscribe_newsletter": True,
            "timezone": "America/Los_Angeles",
            "locale": "en",
            "organizationData": {
                "organizationName": org_name,
                "description": "We build innovative software",
                "industry": "Technology",
                "size": "51-200",
                "website": "https://www.techcorp.com"
            }
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
        assert data["data"]["timezone"] == "America/Los_Angeles"

        # Verify organization with all fields
        org = db_session.query(Organization).filter(Organization.name == org_name).first()
        assert org is not None
        assert org.company_size == "51-200"
        assert org.website == "https://www.techcorp.com"

        print("✓ Test passed - Organization with all fields created")

    def test_register_organization_account_type_verification(self, db_session):
        """Verify AccountType is organization_member with organization_id - REAL API CALL + DB CHECK"""
        print_test_info("Testing Organization AccountType Creation")

        email = generate_unique_email("org_account_type")
        org_name = f"Account Type Test Org {email.split('@')[0]}"

        payload = {
            "first_name": "Account",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Testing account types",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        # Verify in database
        user = db_session.query(User).filter(User.email == email).first()
        assert user is not None

        org = db_session.query(Organization).filter(Organization.name == org_name).first()
        assert org is not None

        account_type = db_session.query(AccountType).filter(
            AccountType.user_id == user.id
        ).first()

        assert account_type is not None
        assert account_type.account_type == AccountTypeEnum.ORGANIZATION_MEMBER
        assert account_type.organization_id == org.id
        assert account_type.is_primary is True

        print("✓ AccountType verified correctly as organization_member")

    def test_register_organization_role_assignment(self, db_session):
        """Verify org_admin role is assigned correctly - REAL API CALL + DB CHECK"""
        print_test_info("Testing Organization Admin Role Assignment")

        email = generate_unique_email("org_role")
        org_name = f"Role Test Org {email.split('@')[0]}"

        payload = {
            "first_name": "Role",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Testing role assignment",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        # Verify role in database
        user = db_session.query(User).filter(User.email == email).first()
        org = db_session.query(Organization).filter(Organization.name == org_name).first()
        role = db_session.query(Role).filter(Role.slug == "org_admin").first()

        user_role = db_session.query(UserRole).filter(
            UserRole.user_id == user.id
        ).first()

        assert user_role is not None
        assert user_role.role_id == role.id
        assert user_role.organization_id == org.id
        assert user_role.is_active is True

        print("✓ Organization admin role assigned correctly")

    def test_register_organization_creator_linked(self, db_session):
        """Verify creator is linked to organization - REAL API CALL + DB CHECK"""
        print_test_info("Testing Organization Creator Link")

        email = generate_unique_email("org_creator")
        org_name = f"Creator Test Org {email.split('@')[0]}"

        payload = {
            "first_name": "Creator",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Testing creator link",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        user = db_session.query(User).filter(User.email == email).first()
        org = db_session.query(Organization).filter(Organization.name == org_name).first()

        assert org.created_by == user.id

        print("✓ Creator linked to organization")


class TestOrganizationRegistrationSlugIntegration:
    """Integration tests for organization slug generation"""

    def test_register_organization_slug_simple(self, db_session):
        """Test simple organization name slug generation - REAL API CALL"""
        print_test_info("Testing Slug Generation - Simple Name")

        email = generate_unique_email("slug_simple")
        org_name = f"Simple Test Org {email.split('@')[0]}"

        payload = {
            "first_name": "Slug",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Testing slug",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        org = db_session.query(Organization).filter(Organization.name == org_name).first()
        assert org is not None
        # Slug should be lowercase and hyphenated
        assert org.slug.islower()
        assert " " not in org.slug

        print(f"✓ Simple slug generated correctly: {org.slug}")

    def test_register_organization_slug_special_chars(self, db_session):
        """Test organization slug with special characters - REAL API CALL"""
        print_test_info("Testing Slug Generation - Special Characters")

        email = generate_unique_email("slug_special")
        org_name = f"Special!@# Chars$%^ Org {email.split('@')[0]}"

        payload = {
            "first_name": "Slug",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Testing slug",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        org = db_session.query(Organization).filter(Organization.name == org_name).first()
        assert org is not None
        # Slug should only contain alphanumeric and hyphens
        assert all(c.isalnum() or c == '-' for c in org.slug)

        print(f"✓ Special characters handled correctly, slug: {org.slug}")

    def test_register_organization_slug_unicode(self, db_session):
        """Test organization slug with unicode characters - REAL API CALL"""
        print_test_info("Testing Slug Generation - Unicode Characters")

        email = generate_unique_email("slug_unicode")
        org_name = f"Café & Résumé Corp {email.split('@')[0]}"

        payload = {
            "first_name": "Unicode",
            "last_name": "Test",
            "email": email,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Unicode testing",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        assert response.status_code == 200

        org = db_session.query(Organization).filter(Organization.name == org_name).first()
        assert org is not None
        # Slug should be ASCII-safe
        assert org.slug.isascii()

        print(f"✓ Unicode handled correctly, slug: {org.slug}")


class TestOrganizationRegistrationValidationIntegration:
    """Integration tests for validation errors"""

    def test_register_organization_missing_name(self):
        """Test organization registration without name - REAL API CALL"""
        print_test_info("Testing Missing Organization Name")

        payload = {
            "first_name": "Admin",
            "last_name": "User",
            "email": generate_unique_email("missing_name"),
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "description": "Missing name",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 422

        print("✓ Missing organization name rejected")

    def test_register_organization_missing_industry(self):
        """Test organization registration without industry - REAL API CALL"""
        print_test_info("Testing Missing Industry")

        payload = {
            "first_name": "Admin",
            "last_name": "User",
            "email": generate_unique_email("missing_industry"),
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Test Org",
                "description": "Missing industry"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 422

        print("✓ Missing industry rejected")

    def test_register_organization_duplicate_slug(self, db_session):
        """Test duplicate organization slug rejection - REAL API CALLS"""
        print_test_info("Testing Duplicate Organization Slug Rejection")

        org_name = f"Unique Organization {generate_unique_email('dup_slug').split('@')[0]}"

        # First registration
        email1 = generate_unique_email("dup_first")
        payload1 = {
            "first_name": "First",
            "last_name": "Admin",
            "email": email1,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "First org",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        print(f"First registration: {org_name}")
        response1 = requests.post(url, json=payload1, timeout=TEST_TIMEOUT)
        assert response1.status_code == 200

        # Second registration with same organization name
        email2 = generate_unique_email("dup_second")
        payload2 = {
            "first_name": "Second",
            "last_name": "Admin",
            "email": email2,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Duplicate org",
                "industry": "Technology"
            }
        }

        print(f"Second registration (duplicate): {org_name}")
        response2 = requests.post(url, json=payload2, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response2.status_code}")
        assert response2.status_code == 400

        data = response2.json()
        assert "slug" in data["detail"].lower() or "exist" in data["detail"].lower()

        print("✓ Duplicate organization slug correctly rejected")

    def test_register_organization_empty_name(self):
        """Test organization registration with empty name - REAL API CALL"""
        print_test_info("Testing Empty Organization Name")

        payload = {
            "first_name": "Admin",
            "last_name": "User",
            "email": generate_unique_email("empty_name"),
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "",
                "description": "Empty name",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 422

        print("✓ Empty organization name rejected")


class TestOrganizationRegistrationRollbackIntegration:
    """Integration tests for transaction rollback"""

    def test_register_organization_rollback_on_duplicate(self, db_session):
        """Verify user creation is rolled back if organization creation fails - REAL API CALLS"""
        print_test_info("Testing Transaction Rollback on Organization Duplicate")

        org_name = f"Rollback Test Org {generate_unique_email('rollback').split('@')[0]}"

        # Create first organization
        email1 = generate_unique_email("rollback_first")
        payload1 = {
            "first_name": "First",
            "last_name": "User",
            "email": email1,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "First",
                "industry": "Technology"
            }
        }

        url = get_full_url(Endpoints.REGISTER)
        response1 = requests.post(url, json=payload1, timeout=TEST_TIMEOUT)
        assert response1.status_code == 200

        # Try to create duplicate (should rollback user creation)
        email2 = generate_unique_email("rollback_second")
        payload2 = {
            "first_name": "Second",
            "last_name": "User",
            "email": email2,
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": org_name,
                "description": "Duplicate",
                "industry": "Technology"
            }
        }

        response2 = requests.post(url, json=payload2, timeout=TEST_TIMEOUT)
        assert response2.status_code == 400

        # Verify second user was NOT created
        user = db_session.query(User).filter(User.email == email2).first()
        assert user is None

        print("✓ Transaction rolled back correctly - user not created")
