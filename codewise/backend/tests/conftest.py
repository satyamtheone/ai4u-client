"""
Pytest Configuration and Fixtures

This file provides shared fixtures and configuration for all integration tests.
pytest automatically discovers and uses this file.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import List

from tests.integration_test_config import DATABASE_URL


# Database session for all tests
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Track created test data for cleanup
created_test_emails: List[str] = []
created_test_org_names: List[str] = []


@pytest.fixture(scope="session")
def db_session():
    """
    Database session fixture available for all tests.
    Scope: session - one session for entire test run.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def track_test_email():
    """
    Fixture to track test emails created during tests.
    Use this to register emails that should be cleaned up.

    Usage in test:
        def test_something(track_test_email):
            email = "test@example.com"
            track_test_email(email)
            # ... rest of test
    """
    def _track(email: str):
        created_test_emails.append(email)
    return _track


@pytest.fixture(scope="function")
def track_test_org():
    """
    Fixture to track test organizations created during tests.
    Use this to register org names that should be cleaned up.

    Usage in test:
        def test_something(track_test_org):
            org_name = "Test Org"
            track_test_org(org_name)
            # ... rest of test
    """
    def _track(org_name: str):
        created_test_org_names.append(org_name)
    return _track


def pytest_sessionstart(session):
    """
    Called before test session starts.
    Clear tracking lists.
    """
    created_test_emails.clear()
    created_test_org_names.clear()
    print("\n" + "="*60)
    print("  Starting Integration Test Session")
    print("="*60)


def pytest_sessionfinish(session, exitstatus):
    """
    Called after test session finishes.
    This is where we can trigger cleanup.
    """
    print("\n" + "="*60)
    print("  Test Session Complete")
    print(f"  Exit Status: {exitstatus}")
    print("="*60)

    # Print summary of tracked test data
    if created_test_emails:
        print(f"\n  Tracked {len(created_test_emails)} test user emails")
    if created_test_org_names:
        print(f"  Tracked {len(created_test_org_names)} test organizations")

    print("\n  Run 'pytest tests/test_cleanup.py -v -s' to clean up test data")
    print("="*60 + "\n")


def pytest_collection_modifyitems(config, items):
    """
    Modify test collection to ensure cleanup tests run last.
    """
    cleanup_tests = []
    other_tests = []

    for item in items:
        if "test_cleanup" in item.nodeid:
            cleanup_tests.append(item)
        else:
            other_tests.append(item)

    # Reorder: run other tests first, then cleanup tests
    items[:] = other_tests + cleanup_tests


@pytest.fixture(scope="session", autouse=True)
def verify_database_connection():
    """
    Verify database connection before running tests.
    autouse=True means this runs automatically.
    """
    try:
        db = SessionLocal()
        # Try a simple query to verify connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()
        print("\n✓ Database connection verified")
    except Exception as e:
        pytest.exit(f"Failed to connect to database: {str(e)}")


@pytest.fixture(scope="session")
def ensure_roles_exist():
    """
    Ensure system roles exist before running tests.
    This prevents role-related failures.
    """
    from core.role_init import init_system_roles, ensure_roles_exist

    db = SessionLocal()
    try:
        print("\n  Initializing system roles...")
        init_system_roles(db)

        if ensure_roles_exist(db):
            print("  ✓ System roles verified")
        else:
            print("  ⚠ Warning: Some system roles may be missing")

        db.close()
    except Exception as e:
        db.close()
        pytest.exit(f"Failed to initialize roles: {str(e)}")


# Markers for different test categories
def pytest_configure(config):
    """Register custom markers"""
    config.addinivalue_line(
        "markers", "individual: Tests for individual user registration"
    )
    config.addinivalue_line(
        "markers", "organization: Tests for organization registration"
    )
    config.addinivalue_line(
        "markers", "member: Tests for organization member addition"
    )
    config.addinivalue_line(
        "markers", "cleanup: Tests for cleanup operations"
    )
    config.addinivalue_line(
        "markers", "health: Tests for health check endpoint"
    )
    config.addinivalue_line(
        "markers", "validation: Tests for input validation"
    )
    config.addinivalue_line(
        "markers", "edge_case: Tests for edge cases"
    )
    config.addinivalue_line(
        "markers", "slow: Slow tests that may take longer"
    )


# Optional: Add timing information to test results
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Add timing information to test reports"""
    outcome = yield
    report = outcome.get_result()

    if report.when == "call":
        # Add duration to test output
        if hasattr(report, 'duration'):
            report.sections.append(
                ("Test Duration", f"{report.duration:.2f}s")
            )
