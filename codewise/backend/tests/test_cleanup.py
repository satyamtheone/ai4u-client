"""
Test Cleanup Module

This module provides cleanup functionality for integration tests.
It removes all test data created during test runs.

Run this after all tests complete:
    pytest tests/test_cleanup.py -v -s
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from tests.integration_test_config import DATABASE_URL, print_test_info
from models.user import User
from models.organization import Organization
from models.account_type import AccountType, UserRole
from models.session import UserSession
from models.activity_log import ActivityLog


# Database session for cleanup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Database session for cleanup"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestDataCleanup:
    """Cleanup test data created during integration tests"""

    def test_cleanup_test_users(self, db_session):
        """Clean up all test users (emails containing '+' or 'example.com')"""
        print_test_info("Cleaning Up Test Users")

        # Find all test users (emails with '+' are test emails from generate_unique_email)
        test_users = db_session.query(User).filter(
            User.email.like('%+%@example.com')
        ).all()

        print(f"Found {len(test_users)} test users to clean up")

        if test_users:
            user_ids = [user.id for user in test_users]

            # Delete related records first (to avoid foreign key constraints)

            # 1. Delete user sessions
            sessions_deleted = db_session.query(UserSession).filter(
                UserSession.user_id.in_(user_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {sessions_deleted} user sessions")

            # 2. Delete activity logs
            activities_deleted = db_session.query(ActivityLog).filter(
                ActivityLog.user_id.in_(user_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {activities_deleted} activity logs")

            # 3. Delete user roles
            roles_deleted = db_session.query(UserRole).filter(
                UserRole.user_id.in_(user_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {roles_deleted} user roles")

            # 4. Delete account types
            accounts_deleted = db_session.query(AccountType).filter(
                AccountType.user_id.in_(user_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {accounts_deleted} account types")

            # 5. Delete users
            users_deleted = db_session.query(User).filter(
                User.id.in_(user_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {users_deleted} users")

            db_session.commit()
            print(f"✓ Successfully cleaned up {len(test_users)} test users")
        else:
            print("✓ No test users to clean up")

    def test_cleanup_test_organizations(self, db_session):
        """Clean up all test organizations (names/slugs containing 'test', 'acme', etc.)"""
        print_test_info("Cleaning Up Test Organizations")

        # Find all test organizations
        test_orgs = db_session.query(Organization).filter(
            (Organization.name.ilike('%test%')) |
            (Organization.name.ilike('%acme%')) |
            (Organization.slug.like('%test%')) |
            (Organization.slug.like('%acme%'))
        ).all()

        print(f"Found {len(test_orgs)} test organizations to clean up")

        if test_orgs:
            org_ids = [org.id for org in test_orgs]

            # Delete related records first

            # 1. Delete user roles associated with these organizations
            org_roles_deleted = db_session.query(UserRole).filter(
                UserRole.organization_id.in_(org_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {org_roles_deleted} organization user roles")

            # 2. Delete account types associated with these organizations
            org_accounts_deleted = db_session.query(AccountType).filter(
                AccountType.organization_id.in_(org_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {org_accounts_deleted} organization account types")

            # 3. Delete activity logs associated with these organizations
            org_activities_deleted = db_session.query(ActivityLog).filter(
                ActivityLog.organization_id.in_(org_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {org_activities_deleted} organization activity logs")

            # 4. Delete organizations
            orgs_deleted = db_session.query(Organization).filter(
                Organization.id.in_(org_ids)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {orgs_deleted} organizations")

            db_session.commit()
            print(f"✓ Successfully cleaned up {len(test_orgs)} test organizations")
        else:
            print("✓ No test organizations to clean up")

    def test_cleanup_orphaned_sessions(self, db_session):
        """Clean up orphaned sessions (sessions with no associated user)"""
        print_test_info("Cleaning Up Orphaned Sessions")

        # Find sessions where user doesn't exist
        orphaned_sessions = db_session.query(UserSession).filter(
            ~UserSession.user_id.in_(
                db_session.query(User.id)
            )
        ).all()

        print(f"Found {len(orphaned_sessions)} orphaned sessions to clean up")

        if orphaned_sessions:
            session_ids = [session.id for session in orphaned_sessions]

            sessions_deleted = db_session.query(UserSession).filter(
                UserSession.id.in_(session_ids)
            ).delete(synchronize_session=False)

            db_session.commit()
            print(f"✓ Successfully cleaned up {sessions_deleted} orphaned sessions")
        else:
            print("✓ No orphaned sessions to clean up")

    def test_cleanup_orphaned_activities(self, db_session):
        """Clean up orphaned activity logs (activities with no associated user)"""
        print_test_info("Cleaning Up Orphaned Activity Logs")

        # Find activities where user doesn't exist
        orphaned_activities = db_session.query(ActivityLog).filter(
            ~ActivityLog.user_id.in_(
                db_session.query(User.id)
            )
        ).all()

        print(f"Found {len(orphaned_activities)} orphaned activity logs to clean up")

        if orphaned_activities:
            activity_ids = [activity.id for activity in orphaned_activities]

            activities_deleted = db_session.query(ActivityLog).filter(
                ActivityLog.id.in_(activity_ids)
            ).delete(synchronize_session=False)

            db_session.commit()
            print(f"✓ Successfully cleaned up {activities_deleted} orphaned activity logs")
        else:
            print("✓ No orphaned activity logs to clean up")

    def test_cleanup_summary(self, db_session):
        """Display cleanup summary"""
        print_test_info("Cleanup Summary")

        # Count remaining test data
        remaining_test_users = db_session.query(User).filter(
            User.email.like('%+%@example.com')
        ).count()

        remaining_test_orgs = db_session.query(Organization).filter(
            (Organization.name.ilike('%test%')) |
            (Organization.name.ilike('%acme%'))
        ).count()

        print(f"Remaining test users: {remaining_test_users}")
        print(f"Remaining test organizations: {remaining_test_orgs}")

        if remaining_test_users == 0 and remaining_test_orgs == 0:
            print("\n✓ All test data cleaned up successfully!")
        else:
            print(f"\n⚠ Warning: Some test data still remains")


class TestSelectiveCleanup:
    """Selective cleanup utilities"""

    def test_cleanup_by_email_pattern(self, db_session):
        """Clean up users matching specific email pattern"""
        print_test_info("Selective Cleanup - By Email Pattern")

        # Example: Clean up users with specific prefix
        # Uncomment and modify pattern as needed
        # pattern = "specific_prefix+%@example.com"
        # users = db_session.query(User).filter(User.email.like(pattern)).all()
        # ... cleanup logic ...

        print("✓ Selective cleanup by email pattern (currently disabled)")
        print("  Uncomment and modify pattern in test_cleanup.py to use")

    def test_cleanup_old_test_data(self, db_session):
        """Clean up test data older than a specific date"""
        print_test_info("Selective Cleanup - Old Test Data")

        from datetime import datetime, timedelta

        # Example: Clean up test users older than 7 days
        cutoff_date = datetime.utcnow() - timedelta(days=7)

        old_test_users = db_session.query(User).filter(
            User.email.like('%+%@example.com'),
            User.created_at < cutoff_date
        ).all()

        print(f"Found {len(old_test_users)} test users older than 7 days")

        if old_test_users:
            print("  (Cleanup disabled - uncomment to enable)")
            # Uncomment to enable cleanup
            # user_ids = [user.id for user in old_test_users]
            # ... cleanup logic similar to test_cleanup_test_users ...
        else:
            print("✓ No old test data to clean up")


def cleanup_all_test_data():
    """
    Utility function to clean up all test data programmatically.
    Can be called from other scripts or as a standalone function.
    """
    db = SessionLocal()
    try:
        print("="*60)
        print("  Starting Complete Test Data Cleanup")
        print("="*60)

        # Clean up test users
        test_users = db.query(User).filter(
            User.email.like('%+%@example.com')
        ).all()

        if test_users:
            user_ids = [user.id for user in test_users]

            # Delete related records
            db.query(UserSession).filter(UserSession.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(ActivityLog).filter(ActivityLog.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(UserRole).filter(UserRole.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(AccountType).filter(AccountType.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)

            print(f"Cleaned up {len(test_users)} test users")

        # Clean up test organizations
        test_orgs = db.query(Organization).filter(
            (Organization.name.ilike('%test%')) |
            (Organization.name.ilike('%acme%'))
        ).all()

        if test_orgs:
            org_ids = [org.id for org in test_orgs]

            # Delete related records
            db.query(UserRole).filter(UserRole.organization_id.in_(org_ids)).delete(synchronize_session=False)
            db.query(AccountType).filter(AccountType.organization_id.in_(org_ids)).delete(synchronize_session=False)
            db.query(ActivityLog).filter(ActivityLog.organization_id.in_(org_ids)).delete(synchronize_session=False)
            db.query(Organization).filter(Organization.id.in_(org_ids)).delete(synchronize_session=False)

            print(f"Cleaned up {len(test_orgs)} test organizations")

        db.commit()
        print("="*60)
        print("  Cleanup Complete!")
        print("="*60)

    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    """Run cleanup as a standalone script"""
    print("Running test data cleanup...")
    cleanup_all_test_data()
    print("Done!")
