
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from models.user import User
from models.organization import Organization
from models.account_type import AccountType, AccountTypeEnum, UserRole
from models.role import Role

# =============================================================================
# TEST DATA - ORGANIZATION REGISTRATION
# =============================================================================

ORGANIZATION_SUCCESS_TEST_DATA = [
    {
        "id": "minimal_fields",
        "payload": {
            "first_name": "Admin",
            "last_name": "User",
            "email": "admin@acmecorp.com",
            "password": "SecurePass123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Acme Corporation",
                "description": "Test organization",
                "industry": "Technology"
            }
        },
        "expected": {
            "status_code": 200,
            "success": True,
            "message": "User registered successfully",
            "email": "admin@acmecorp.com",
            "first_name": "Admin",
            "last_name": "User",
            "org_name": "Acme Corporation",
            "org_slug": "acme-corporation"
        }
    },
    {
        "id": "all_fields",
        "payload": {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.admin@techcorp.com",
            "password": "AnotherSecure123!",
            "phone": "+1234567890",
            "accept_terms": True,
            "subscribe_newsletter": True,
            "timezone": "America/Los_Angeles",
            "locale": "en",
            "organizationData": {
                "organizationName": "Tech Corporation",
                "description": "We build innovative software",
                "industry": "Technology",
                "size": "51-200",
                "website": "https://www.techcorp.com"
            }
        },
        "expected": {
            "status_code": 200,
            "success": True,
            "org_name": "Tech Corporation"
        }
    }
]

ORGANIZATION_SLUG_TEST_DATA = [
    {
        "id": "simple_name",
        "org_name": "Simple Name",
        "expected_slug": "simple-name"
    },
    {
        "id": "with_spaces",
        "org_name": "Name With Spaces",
        "expected_slug": "name-with-spaces"
    },
    {
        "id": "with_underscores",
        "org_name": "Name_With_Underscores",
        "expected_slug": "name-with-underscores"
    },
    {
        "id": "with_hyphens",
        "org_name": "Name-With-Hyphens",
        "expected_slug": "name-with-hyphens"
    },
    {
        "id": "with_numbers",
        "org_name": "Name123 Numbers",
        "expected_slug": "name123-numbers"
    },
    {
        "id": "special_characters",
        "org_name": "Special!@#Characters",
        "expected_slug": "special-characters"
    },
    {
        "id": "company_with_numbers",
        "org_name": "Company 123 Inc",
        "expected_slug": "company-123-inc"
    },
    {
        "id": "multiple_spaces",
        "org_name": "Company   With   Spaces",
        "expected_slug": "company-with-spaces"
    }
]

ORGANIZATION_VALIDATION_ERROR_DATA = [
    {
        "id": "missing_organization_name",
        "payload": {
            "first_name": "Admin",
            "last_name": "User",
            "email": "missing.org@test.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "description": "Missing name",
                "industry": "Technology"
            }
        },
        "expected_status": 422
    },
    {
        "id": "missing_industry",
        "payload": {
            "first_name": "Admin",
            "last_name": "User",
            "email": "missing.industry@test.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Test Org",
                "description": "Missing industry"
            }
        },
        "expected_status": 422
    },
    {
        "id": "empty_organization_name",
        "payload": {
            "first_name": "Admin",
            "last_name": "User",
            "email": "empty.org@test.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "",
                "description": "Empty name",
                "industry": "Technology"
            }
        },
        "expected_status": 422
    }
]

ORGANIZATION_EDGE_CASES_DATA = [
    {
        "id": "unicode_name",
        "payload": {
            "first_name": "Unicode",
            "last_name": "Admin",
            "email": "unicode.org@test.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Café & Résumé Corp",
                "description": "Unicode testing",
                "industry": "Technology"
            }
        },
        "expected": {
            "status_code": 200,
            "org_name": "Café & Résumé Corp",
            "slug_contains": ["caf", "resume"]
        }
    },
    {
        "id": "optional_fields_null",
        "payload": {
            "first_name": "Minimal",
            "last_name": "Org",
            "email": "minimal.org@test.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Minimal Org",
                "description": "Just the basics",
                "industry": "Technology"
            }
        },
        "expected": {
            "status_code": 200,
            "website": None
        }
    }
]


# =============================================================================
# PARAMETRIZED TEST CLASSES - ORGANIZATION
# =============================================================================

class TestOrganizationRegistration:
    """Parametrized test suite for organization registration"""

    @pytest.mark.parametrize("test_data", ORGANIZATION_SUCCESS_TEST_DATA, ids=lambda x: x["id"])
    def test_register_organization_admin_success(self, client: TestClient, db_session: Session, test_data):
        """Test successful organization registration"""
        response = client.post("/api/v1/auth/register", json=test_data["payload"])
        
        assert response.status_code == test_data["expected"]["status_code"]
        data = response.json()
        
        # Verify expected fields
        expected = test_data["expected"]
        if "success" in expected:
            assert data["success"] == expected["success"]
        if "message" in expected:
            assert data["message"] == expected["message"]
        
        # Verify organization in database
        if "org_name" in expected:
            org = db_session.query(Organization).filter(
                Organization.name == expected["org_name"]
            ).first()
            assert org is not None
            
            if "org_slug" in expected:
                assert org.slug == expected["org_slug"]

    @pytest.mark.parametrize("test_data", ORGANIZATION_SLUG_TEST_DATA, ids=lambda x: x["id"])
    def test_register_organization_slug_generation(self, client: TestClient, db_session: Session, test_data):
        """Test organization slug generation with various inputs"""
        payload = {
            "first_name": "Slug",
            "last_name": "Test",
            "email": f"slug.{test_data['id']}@test.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": test_data["org_name"],
                "description": "Testing slug",
                "industry": "Technology"
            }
        }
        
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 200

        org = db_session.query(Organization).filter(
            Organization.name == test_data["org_name"]
        ).first()

        assert org is not None
        assert org.slug == test_data["expected_slug"]

    def test_register_organization_account_type(self, client: TestClient, db_session: Session):
        """Verify AccountType is organization_member with organization_id"""
        payload = {
            "first_name": "Account",
            "last_name": "Test",
            "email": "account.test@orgtest.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Account Test Org",
                "description": "Testing account types",
                "industry": "Technology"
            }
        }
        
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 200

        user = db_session.query(User).filter(User.email == payload["email"]).first()
        org = db_session.query(Organization).filter(
            Organization.name == payload["organizationData"]["organizationName"]
        ).first()

        assert user is not None
        assert org is not None

        account_type = db_session.query(AccountType).filter(
            AccountType.user_id == user.id
        ).first()

        assert account_type is not None
        assert account_type.account_type == AccountTypeEnum.ORGANIZATION_MEMBER
        assert account_type.organization_id == org.id
        assert account_type.is_primary is True

    def test_register_organization_admin_role_assigned(self, client: TestClient, db_session: Session):
        """Verify org_admin role is assigned"""
        role = db_session.query(Role).filter(Role.slug == "org_admin").first()
        if not role:
            role = Role(
                name="Organization Admin",
                slug="org_admin",
                description="Administrator of an organization"
            )
            db_session.add(role)
            db_session.commit()

        payload = {
            "first_name": "Role",
            "last_name": "Admin",
            "email": "role.admin@roletest.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Role Test Organization",
                "description": "Testing role assignment",
                "industry": "Technology"
            }
        }

        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 200

        user = db_session.query(User).filter(User.email == payload["email"]).first()
        org = db_session.query(Organization).filter(
            Organization.name == payload["organizationData"]["organizationName"]
        ).first()

        user_role = db_session.query(UserRole).filter(UserRole.user_id == user.id).first()

        assert user_role is not None
        assert user_role.role_id == role.id
        assert user_role.organization_id == org.id
        assert user_role.is_active is True

    def test_register_organization_creator_linked(self, client: TestClient, db_session: Session):
        """Verify creator is linked to organization"""
        payload = {
            "first_name": "Creator",
            "last_name": "Test",
            "email": "creator@creatortest.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Creator Test Org",
                "description": "Testing creator link",
                "industry": "Technology"
            }
        }

        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 200

        user = db_session.query(User).filter(User.email == payload["email"]).first()
        org = db_session.query(Organization).filter(
            Organization.name == payload["organizationData"]["organizationName"]
        ).first()

        assert org.created_by == user.id


class TestOrganizationRegistrationValidation:
    """Parametrized validation tests for organization registration"""

    @pytest.mark.parametrize("test_data", ORGANIZATION_VALIDATION_ERROR_DATA, ids=lambda x: x["id"])
    def test_register_validation_errors(self, client: TestClient, test_data):
        """Test various validation error scenarios"""
        response = client.post("/api/v1/auth/register", json=test_data["payload"])
        assert response.status_code == test_data["expected_status"]

    def test_register_duplicate_organization_slug(self, client: TestClient):
        """Test registration fails with duplicate organization slug"""
        payload = {
            "first_name": "First",
            "last_name": "Admin",
            "email": "first.admin@testorg.com",
            "password": "Password123!",
            "accept_terms": True,
            "organizationData": {
                "organizationName": "Unique Organization",
                "description": "First org",
                "industry": "Technology"
            }
        }
        
        # First registration
        client.post("/api/v1/auth/register", json=payload)

        # Second registration with same organization name
        payload["email"] = "second.admin@testorg.com"
        payload["first_name"] = "Second"
        payload["organizationData"]["description"] = "Duplicate org"
        
        response = client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 400
        data = response.json()
        assert "slug" in data["detail"].lower() or "exist" in data["detail"].lower()


class TestOrganizationRegistrationEdgeCases:
    """Parametrized edge case tests for organization registration"""

    @pytest.mark.parametrize("test_data", ORGANIZATION_EDGE_CASES_DATA, ids=lambda x: x["id"])
    def test_edge_cases(self, client: TestClient, db_session: Session, test_data):
        """Test edge cases for organization registration"""
        response = client.post("/api/v1/auth/register", json=test_data["payload"])
        
        expected = test_data["expected"]
        assert response.status_code == expected["status_code"]
        
        if expected["status_code"] == 200:
            org_name = test_data["payload"]["organizationData"]["organizationName"]
            org = db_session.query(Organization).filter(Organization.name == org_name).first()
            
            assert org is not None
            
            # Check slug contains expected strings
            if "slug_contains" in expected:
                assert any(s in org.slug for s in expected["slug_contains"])
            
            # Check other expected fields
            for key, value in expected.items():
                if key not in ["status_code", "org_name", "slug_contains"]:
                    assert getattr(org, key) == value

    def test_register_user_without_organization_data(self, client: TestClient, db_session: Session):
        """Test that omitting organizationData creates individual user"""
        payload = {
            "first_name": "Individual",
            "last_name": "User",
            "email": "individual.user@test.com",
            "password": "Password123!",
            "accept_terms": True
        }
        
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 200

        user = db_session.query(User).filter(User.email == payload["email"]).first()
        account_type = db_session.query(AccountType).filter(
            AccountType.user_id == user.id
        ).first()

        assert account_type.account_type == AccountTypeEnum.INDIVIDUAL
        assert account_type.organization_id is None


class TestOrganizationRegistrationRollback:
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