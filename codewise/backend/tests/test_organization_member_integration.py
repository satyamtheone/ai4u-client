"""
Integration Tests for Organization Member Addition

These tests make REAL HTTP requests to the running API server.
Ensure the API is running at http://localhost:8001 before executing.

Run tests:
    pytest tests/test_organization_member_integration.py -v -s
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


@pytest.fixture
def org_admin_and_token(db_session):
    """Create an org admin and return user, org, and auth token"""
    email = generate_unique_email("org_admin_fixture")
    org_name = f"Test Organization {email.split('@')[0]}"
    password = "AdminPass123!"

    # Register organization admin
    register_payload = {
        "first_name": "Admin",
        "last_name": "User",
        "email": email,
        "password": password,
        "accept_terms": True,
        "organizationData": {
            "organizationName": org_name,
            "description": "Test organization for member addition",
            "industry": "Technology"
        }
    }

    register_url = get_full_url(Endpoints.REGISTER)
    register_response = requests.post(register_url, json=register_payload, timeout=TEST_TIMEOUT)
    assert register_response.status_code == 200

    # Login to get token
    login_payload = {
        "email": email,
        "password": password
    }

    login_url = get_full_url(Endpoints.LOGIN)
    login_response = requests.post(login_url, json=login_payload, timeout=TEST_TIMEOUT)
    assert login_response.status_code == 200

    token = login_response.json()["data"]["access_token"]

    # Get user and org from database
    user = db_session.query(User).filter(User.email == email).first()
    org = db_session.query(Organization).filter(Organization.name == org_name).first()

    return {
        "user": user,
        "org": org,
        "token": token,
        "email": email
    }


class TestOrganizationMemberAdditionIntegration:
    """Integration tests for organization member addition by org admin"""

    def test_add_member_minimal_fields(self, db_session, org_admin_and_token):
        """Test adding member with minimal fields - REAL API CALL"""
        print_test_info("Testing Add Organization Member - Minimal Fields")

        admin_data = org_admin_and_token
        member_email = generate_unique_email("member_minimal")

        payload = {
            "first_name": "John",
            "last_name": "Member",
            "email": member_email,
            "password": "MemberPass123!"
        }

        url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {admin_data['token']}"}

        print(f"POST {url}")
        print(f"Payload: {payload}")

        response = requests.post(url, json=payload, headers=headers, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == member_email
        assert data["data"]["first_name"] == "John"
        assert data["data"]["last_name"] == "Member"

        # Verify member in database
        member = db_session.query(User).filter(User.email == member_email).first()
        assert member is not None
        assert member.first_name == "John"

        # Verify account type
        account_type = db_session.query(AccountType).filter(
            AccountType.user_id == member.id
        ).first()
        assert account_type is not None
        assert account_type.account_type == AccountTypeEnum.ORGANIZATION_MEMBER
        assert account_type.organization_id == admin_data['org'].id

        print("✓ Member added successfully with correct account type")

    def test_add_member_all_fields(self, db_session, org_admin_and_token):
        """Test adding member with all fields - REAL API CALL"""
        print_test_info("Testing Add Organization Member - All Fields")

        admin_data = org_admin_and_token
        member_email = generate_unique_email("member_full")

        payload = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": member_email,
            "password": "MemberPass123!",
            "phone": "+1234567890",
            "role": "org_member",
            "send_invitation_email": False,
            "timezone": "America/New_York",
            "locale": "en"
        }

        url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {admin_data['token']}"}

        response = requests.post(url, json=payload, headers=headers, timeout=TEST_TIMEOUT)

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["phone"] == "+1234567890"
        assert data["data"]["timezone"] == "America/New_York"

        print("✓ Member with all fields added successfully")

    def test_add_member_role_assignment_org_member(self, db_session, org_admin_and_token):
        """Test org_member role is assigned correctly - REAL API CALL + DB CHECK"""
        print_test_info("Testing Organization Member Role Assignment")

        admin_data = org_admin_and_token
        member_email = generate_unique_email("member_role")

        payload = {
            "first_name": "Role",
            "last_name": "Test",
            "email": member_email,
            "password": "MemberPass123!",
            "role": "org_member"
        }

        url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {admin_data['token']}"}

        response = requests.post(url, json=payload, headers=headers, timeout=TEST_TIMEOUT)
        assert response.status_code == 200

        # Verify role in database
        member = db_session.query(User).filter(User.email == member_email).first()
        role = db_session.query(Role).filter(Role.slug == "org_member").first()

        user_role = db_session.query(UserRole).filter(
            UserRole.user_id == member.id
        ).first()

        assert user_role is not None
        assert user_role.role_id == role.id
        assert user_role.organization_id == admin_data['org'].id
        assert user_role.is_active is True

        print("✓ org_member role assigned correctly")

    def test_add_member_role_assignment_org_admin(self, db_session, org_admin_and_token):
        """Test org_admin role can be assigned - REAL API CALL + DB CHECK"""
        print_test_info("Testing Adding Member as Org Admin")

        admin_data = org_admin_and_token
        member_email = generate_unique_email("member_admin")

        payload = {
            "first_name": "Admin",
            "last_name": "Member",
            "email": member_email,
            "password": "AdminPass123!",
            "role": "org_admin"
        }

        url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {admin_data['token']}"}

        response = requests.post(url, json=payload, headers=headers, timeout=TEST_TIMEOUT)
        assert response.status_code == 200

        # Verify role in database
        member = db_session.query(User).filter(User.email == member_email).first()
        role = db_session.query(Role).filter(Role.slug == "org_admin").first()

        user_role = db_session.query(UserRole).filter(
            UserRole.user_id == member.id
        ).first()

        assert user_role is not None
        assert user_role.role_id == role.id

        print("✓ org_admin role assigned correctly to member")

    def test_member_can_login(self, db_session, org_admin_and_token):
        """Test that added member can login - REAL API CALLS"""
        print_test_info("Testing Member Login After Addition")

        admin_data = org_admin_and_token
        member_email = generate_unique_email("member_login")
        member_password = "LoginTest123!"

        # Add member
        add_payload = {
            "first_name": "Login",
            "last_name": "Test",
            "email": member_email,
            "password": member_password
        }

        add_url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {admin_data['token']}"}

        add_response = requests.post(add_url, json=add_payload, headers=headers, timeout=TEST_TIMEOUT)
        assert add_response.status_code == 200

        # Try to login as the member
        login_payload = {
            "email": member_email,
            "password": member_password
        }

        login_url = get_full_url(Endpoints.LOGIN)
        login_response = requests.post(login_url, json=login_payload, timeout=TEST_TIMEOUT)

        print(f"Login Status Code: {login_response.status_code}")
        assert login_response.status_code == 200

        data = login_response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]

        print("✓ Member can login successfully")


class TestOrganizationMemberAuthorizationIntegration:
    """Integration tests for authorization checks"""

    def test_non_admin_cannot_add_member(self, db_session, org_admin_and_token):
        """Test that org_member (non-admin) cannot add members - REAL API CALLS"""
        print_test_info("Testing Non-Admin Authorization Check")

        admin_data = org_admin_and_token

        # First, add a regular member
        member_email = generate_unique_email("non_admin")
        member_password = "MemberPass123!"

        add_payload = {
            "first_name": "Regular",
            "last_name": "Member",
            "email": member_email,
            "password": member_password,
            "role": "org_member"
        }

        add_url = get_full_url(Endpoints.ADD_MEMBER)
        admin_headers = {"Authorization": f"Bearer {admin_data['token']}"}

        add_response = requests.post(add_url, json=add_payload, headers=admin_headers, timeout=TEST_TIMEOUT)
        assert add_response.status_code == 200

        # Login as the member
        login_payload = {
            "email": member_email,
            "password": member_password
        }

        login_url = get_full_url(Endpoints.LOGIN)
        login_response = requests.post(login_url, json=login_payload, timeout=TEST_TIMEOUT)
        assert login_response.status_code == 200

        member_token = login_response.json()["data"]["access_token"]

        # Try to add another member using non-admin token
        new_member_email = generate_unique_email("unauthorized")
        unauthorized_payload = {
            "first_name": "Unauthorized",
            "last_name": "Attempt",
            "email": new_member_email,
            "password": "Pass123!"
        }

        member_headers = {"Authorization": f"Bearer {member_token}"}
        unauthorized_response = requests.post(
            add_url,
            json=unauthorized_payload,
            headers=member_headers,
            timeout=TEST_TIMEOUT
        )

        print(f"Unauthorized attempt status: {unauthorized_response.status_code}")
        assert unauthorized_response.status_code == 403

        print("✓ Non-admin correctly denied permission")

    def test_individual_user_cannot_add_member(self, db_session):
        """Test that individual user cannot add members - REAL API CALLS"""
        print_test_info("Testing Individual User Authorization Check")

        # Register individual user
        individual_email = generate_unique_email("individual")
        individual_password = "IndividualPass123!"

        register_payload = {
            "first_name": "Individual",
            "last_name": "User",
            "email": individual_email,
            "password": individual_password,
            "accept_terms": True
        }

        register_url = get_full_url(Endpoints.REGISTER)
        register_response = requests.post(register_url, json=register_payload, timeout=TEST_TIMEOUT)
        assert register_response.status_code == 200

        # Login as individual
        login_payload = {
            "email": individual_email,
            "password": individual_password
        }

        login_url = get_full_url(Endpoints.LOGIN)
        login_response = requests.post(login_url, json=login_payload, timeout=TEST_TIMEOUT)
        assert login_response.status_code == 200

        individual_token = login_response.json()["data"]["access_token"]

        # Try to add member
        member_payload = {
            "first_name": "Test",
            "last_name": "Member",
            "email": generate_unique_email("unauthorized_individual"),
            "password": "Pass123!"
        }

        add_url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {individual_token}"}

        response = requests.post(add_url, json=member_payload, headers=headers, timeout=TEST_TIMEOUT)

        print(f"Individual attempt status: {response.status_code}")
        assert response.status_code == 403

        print("✓ Individual user correctly denied permission")


class TestOrganizationMemberValidationIntegration:
    """Integration tests for validation errors"""

    def test_add_member_duplicate_email(self, db_session, org_admin_and_token):
        """Test duplicate email rejection - REAL API CALLS"""
        print_test_info("Testing Duplicate Member Email Rejection")

        admin_data = org_admin_and_token
        member_email = generate_unique_email("duplicate_member")

        payload = {
            "first_name": "First",
            "last_name": "Member",
            "email": member_email,
            "password": "Pass123!"
        }

        url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {admin_data['token']}"}

        # First addition
        response1 = requests.post(url, json=payload, headers=headers, timeout=TEST_TIMEOUT)
        assert response1.status_code == 200

        # Second addition with same email
        response2 = requests.post(url, json=payload, headers=headers, timeout=TEST_TIMEOUT)

        print(f"Duplicate attempt status: {response2.status_code}")
        assert response2.status_code == 400

        data = response2.json()
        assert "already exists" in data["detail"].lower()

        print("✓ Duplicate member email correctly rejected")

    def test_add_member_invalid_email(self, org_admin_and_token):
        """Test invalid email format - REAL API CALL"""
        print_test_info("Testing Invalid Member Email")

        admin_data = org_admin_and_token

        payload = {
            "first_name": "Invalid",
            "last_name": "Email",
            "email": "not-an-email",
            "password": "Pass123!"
        }

        url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {admin_data['token']}"}

        response = requests.post(url, json=payload, headers=headers, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 422

        print("✓ Invalid email rejected")

    def test_add_member_weak_password(self, org_admin_and_token):
        """Test weak password rejection - REAL API CALL"""
        print_test_info("Testing Weak Member Password")

        admin_data = org_admin_and_token

        payload = {
            "first_name": "Weak",
            "last_name": "Password",
            "email": generate_unique_email("weak_pass"),
            "password": "short"
        }

        url = get_full_url(Endpoints.ADD_MEMBER)
        headers = {"Authorization": f"Bearer {admin_data['token']}"}

        response = requests.post(url, json=payload, headers=headers, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 422

        print("✓ Weak password rejected")

    def test_add_member_without_auth(self):
        """Test member addition without authentication - REAL API CALL"""
        print_test_info("Testing Unauthenticated Member Addition")

        payload = {
            "first_name": "No",
            "last_name": "Auth",
            "email": generate_unique_email("no_auth"),
            "password": "Pass123!"
        }

        url = get_full_url(Endpoints.ADD_MEMBER)
        # No Authorization header

        response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 401

        print("✓ Unauthenticated request correctly rejected")
