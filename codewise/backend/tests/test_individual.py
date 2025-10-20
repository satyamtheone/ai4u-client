"""
Parametrized Test cases for Individual User

Tests cover:
- Successful registrations (individual)
- Validation errors
- Duplicate handling
- Account type verification
- Role assignment
- Edge cases
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from models.user import User
from models.account_type import AccountType, AccountTypeEnum, UserRole
from models.role import Role


# =============================================================================
# TEST DATA - INDIVIDUAL USER REGISTRATION
# =============================================================================

INDIVIDUAL_SUCCESS_TEST_DATA = [
    {
        "id": "minimal_fields",
        "payload": {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "password": "SecurePass123!",
            "accept_terms": True
        },
        "expected": {
            "status_code": 200,
            "success": True,
            "message": "User registered successfully",
            "email": "john.doe@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "full_name": "John Doe",
            "is_active": True,
            "is_email_verified": False,
            "auth_method": "email",
            "account_type": "individual",
            "login_count": 0
        }
    },
    {
        "id": "all_fields",
        "payload": {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "password": "AnotherSecure123!",
            "phone": "+1234567890",
            "account_type": "individual",
            "auth_method": "EMAIL",
            "accept_terms": True,
            "subscribe_newsletter": True,
            "timezone": "America/New_York",
            "locale": "en"
        },
        "expected": {
            "status_code": 200,
            "success": True,
            "email": "jane.smith@example.com",
            "phone": "+1234567890",
            "timezone": "America/New_York",
            "locale": "en",
            "subscribe_newsletter": True
        }
    },
    {
        "id": "special_chars_in_name",
        "payload": {
            "first_name": "Jean-Pierre",
            "last_name": "O'Brien",
            "email": "special.chars@example.com",
            "password": "Password123!",
            "accept_terms": True
        },
        "expected": {
            "status_code": 200,
            "first_name": "Jean-Pierre",
            "last_name": "O'Brien"
        }
    },
    {
        "id": "unicode_characters",
        "payload": {
            "first_name": "José",
            "last_name": "Müller",
            "email": "unicode@example.com",
            "password": "Password123!",
            "accept_terms": True
        },
        "expected": {
            "status_code": 200,
            "first_name": "José",
            "last_name": "Müller"
        }
    }
]

INDIVIDUAL_VALIDATION_ERROR_DATA = [
    {
        "id": "missing_required_fields",
        "payload": {
            "email": "incomplete@example.com"
        },
        "expected_status": 422
    },
    {
        "id": "invalid_email",
        "payload": {
            "first_name": "John",
            "last_name": "Doe",
            "email": "not-an-email",
            "password": "Password123!",
            "accept_terms": True
        },
        "expected_status": 422
    },
    {
        "id": "weak_password",
        "payload": {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "password": "short",
            "accept_terms": True
        },
        "expected_status": 422
    },
    {
        "id": "empty_first_name",
        "payload": {
            "first_name": "",
            "last_name": "Doe",
            "email": "test@example.com",
            "password": "Password123!",
            "accept_terms": True
        },
        "expected_status": 422
    },
    {
        "id": "empty_last_name",
        "payload": {
            "first_name": "John",
            "last_name": "",
            "email": "test@example.com",
            "password": "Password123!",
            "accept_terms": True
        },
        "expected_status": 422
    },
    {
        "id": "invalid_phone_too_long",
        "payload": {
            "first_name": "John",
            "last_name": "Doe",
            "email": "phone.test@example.com",
            "password": "Password123!",
            "phone": "a" * 21,
            "accept_terms": True
        },
        "expected_status": 422
    }
]

INDIVIDUAL_EDGE_CASES_DATA = [
    {
        "id": "uppercase_email",
        "payload": {
            "first_name": "Case",
            "last_name": "Test",
            "email": "UPPERCASE@EXAMPLE.COM",
            "password": "Password123!",
            "accept_terms": True
        },
        "expected": {
            "status_code": 200,
            "email_stored": "uppercase@example.com"
        }
    },
    {
        "id": "whitespace_in_names",
        "payload": {
            "first_name": "  John  ",
            "last_name": "  Doe  ",
            "email": "whitespace@example.com",
            "password": "Password123!",
            "accept_terms": True
        },
        "expected": {
            "status_code": 200
        }
    },
    {
        "id": "default_values",
        "payload": {
            "first_name": "Default",
            "last_name": "User",
            "email": "defaults@example.com",
            "password": "Password123!",
            "accept_terms": True
        },
        "expected": {
            "status_code": 200,
            "timezone": "UTC",
            "locale": "en",
            "subscribe_newsletter": False,
            "auth_method": "email",
            "is_active": True,
            "is_email_verified": False
        }
    },
    {
        "id": "accept_terms_false",
        "payload": {
            "first_name": "John",
            "last_name": "Doe",
            "email": "noterms@example.com",
            "password": "Password123!",
            "accept_terms": False
        },
        "expected": {
            "status_code": [200, 400, 422]
        }
    }
]


# =============================================================================
# PARAMETRIZED TEST CLASSES - INDIVIDUAL USER
# =============================================================================

class TestIndividualRegistration:
    """Parametrized test suite for individual user registration"""

    @pytest.mark.parametrize("test_data", INDIVIDUAL_SUCCESS_TEST_DATA, ids=lambda x: x["id"])
    def test_register_individual_user_success(self, client: TestClient, db_session: Session, test_data):
        """Test successful individual user registration with various inputs"""
        response = client.post("/api/v1/auth/register", json=test_data["payload"])
        
        assert response.status_code == test_data["expected"]["status_code"]
        data = response.json()
        
        # Verify expected fields
        for key, value in test_data["expected"].items():
            if key == "status_code":
                continue
            if key in ["success", "message"]:
                assert data.get(key) == value
            else:
                assert data["data"].get(key) == value

    def test_register_individual_user_account_type_created(self, client: TestClient, db_session: Session):
        """Verify AccountType record is created correctly"""
        test_payload = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test.account@example.com",
            "password": "Password123!",
            "accept_terms": True
        }
        
        response = client.post("/api/v1/auth/register", json=test_payload)
        assert response.status_code == 200

        user = db_session.query(User).filter(User.email == test_payload["email"]).first()
        assert user is not None

        account_type = db_session.query(AccountType).filter(
            AccountType.user_id == user.id
        ).first()

        assert account_type is not None
        assert account_type.account_type == AccountTypeEnum.INDIVIDUAL
        assert account_type.organization_id is None
        assert account_type.is_primary is True

    def test_register_individual_user_role_assigned(self, client: TestClient, db_session: Session):
        """Verify 'individual_user' role is assigned"""
        role = db_session.query(Role).filter(Role.slug == "individual_user").first()
        if not role:
            role = Role(
                name="Individual User",
                slug="individual_user",
                description="Default role for individual users"
            )
            db_session.add(role)
            db_session.commit()

        test_payload = {
            "first_name": "Role",
            "last_name": "Test",
            "email": "role.test@example.com",
            "password": "Password123!",
            "accept_terms": True
        }

        response = client.post("/api/v1/auth/register", json=test_payload)
        assert response.status_code == 200

        user = db_session.query(User).filter(User.email == test_payload["email"]).first()
        user_role = db_session.query(UserRole).filter(UserRole.user_id == user.id).first()

        assert user_role is not None
        assert user_role.role_id == role.id
        assert user_role.organization_id is None
        assert user_role.is_active is True


class TestIndividualRegistrationValidation:
    """Parametrized validation tests for individual registration"""

    @pytest.mark.parametrize("test_data", INDIVIDUAL_VALIDATION_ERROR_DATA, ids=lambda x: x["id"])
    def test_register_validation_errors(self, client: TestClient, test_data):
        """Test various validation error scenarios"""
        response = client.post("/api/v1/auth/register", json=test_data["payload"])
        assert response.status_code == test_data["expected_status"]

    def test_register_duplicate_email(self, client: TestClient):
        """Test registration fails with duplicate email"""
        payload = {
            "first_name": "First",
            "last_name": "User",
            "email": "duplicate@example.com",
            "password": "Password123!",
            "accept_terms": True
        }
        
        # First registration
        client.post("/api/v1/auth/register", json=payload)

        # Second registration with same email
        payload["first_name"] = "Second"
        response = client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"].lower()


class TestIndividualRegistrationEdgeCases:
    """Parametrized edge case tests"""

    @pytest.mark.parametrize("test_data", INDIVIDUAL_EDGE_CASES_DATA, ids=lambda x: x["id"])
    def test_edge_cases(self, client: TestClient, db_session: Session, test_data):
        """Test edge cases for individual registration"""
        response = client.post("/api/v1/auth/register", json=test_data["payload"])
        
        expected = test_data["expected"]
        status_code = expected["status_code"]
        
        if isinstance(status_code, list):
            assert response.status_code in status_code
        else:
            assert response.status_code == status_code
            
            if status_code == 200:
                # Check email storage if specified
                if "email_stored" in expected:
                    user = db_session.query(User).filter(
                        User.email == expected["email_stored"]
                    ).first()
                    assert user is not None
                    assert user.email == expected["email_stored"]
                
                # Check other expected fields
                data = response.json()["data"]
                for key, value in expected.items():
                    if key not in ["status_code", "email_stored"]:
                        assert data.get(key) == value



    """Test transaction rollback scenarios"""

    def test_register_organization_rollback_on_failure(self, client: TestClient, db_session: Session):
        """Verify user creation is rolled back if organization creation fails"""
        payload = {
            "first_name": "First",
            "last_name": "User",
            "email": "first@rollback.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Rollback Test Org",
                "description": "First",
                "industry": "Technology"
            }
        }
        
        # Create first organization
        client.post("/api/v1/auth/register", json=payload)

        # Try to create duplicate (should rollback user creation)
        payload["email"] = "second@rollback.com"
        payload["first_name"] = "Second"
        payload["organizationData"]["description"] = "Duplicate"
        
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 400

        # Verify second user was NOT created
        user = db_session.query(User).filter(User.email == "second@rollback.com").first()
        assert user is None