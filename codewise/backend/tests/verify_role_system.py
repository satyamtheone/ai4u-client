"""
Quick verification script for role system

This script directly checks the database to verify that system roles exist.
Run with: python tests/verify_role_system.py
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.role import Role
from core.role_init import init_system_roles, ensure_roles_exist, SYSTEM_ROLES
import os

# Database configuration
DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres123@localhost:5432/multitenancy_app"
)

def verify_roles():
    """Verify that all system roles exist in the database"""
    print("="*60)
    print("ROLE SYSTEM VERIFICATION")
    print("="*60)

    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Initialize system roles
        print("\n1. Initializing system roles...")
        init_system_roles(db)
        print("   ✓ System roles initialized")

        # Verify all roles exist
        print("\n2. Verifying roles exist...")
        if ensure_roles_exist(db):
            print("   ✓ All system roles verified")
        else:
            print("   ✗ Some system roles missing")
            return False

        # List all roles
        print("\n3. Current system roles in database:")
        roles = db.query(Role).filter(Role.is_system_role == True).all()

        for role in roles:
            print(f"   - {role.name} (slug: {role.slug})")
            print(f"     Description: {role.description}")
            print(f"     Active: {role.is_active}")
            print()

        # Verify expected roles
        print("4. Checking expected roles:")
        expected_slugs = [r["slug"] for r in SYSTEM_ROLES]
        found_slugs = [r.slug for r in roles]

        for slug in expected_slugs:
            if slug in found_slugs:
                print(f"   ✓ {slug}")
            else:
                print(f"   ✗ {slug} MISSING")

        print("\n" + "="*60)
        print("VERIFICATION COMPLETE")
        print("="*60)

        return True

    except Exception as e:
        print(f"\n✗ Error during verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = verify_roles()
    exit(0 if success else 1)
