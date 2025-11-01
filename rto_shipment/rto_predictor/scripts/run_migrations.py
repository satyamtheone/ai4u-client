#!/usr/bin/env python3
"""
Database Migration Runner for RTO Prediction System

Provides a simple interface for running database migrations using Alembic.

Usage:
    python scripts/run_migrations.py upgrade    # Upgrade to latest
    python scripts/run_migrations.py downgrade  # Downgrade by 1
    python scripts/run_migrations.py current    # Show current version
    python scripts/run_migrations.py history    # Show migration history
"""

import sys
import os
from pathlib import Path
import subprocess
import logging

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def check_alembic_installed():
    """Check if Alembic is installed"""
    try:
        import alembic
        return True
    except ImportError:
        return False


def run_alembic_command(command: str):
    """Run an Alembic command"""

    # Change to project root
    os.chdir(project_root)

    # Build alembic command
    alembic_args = ['alembic'] + command.split()

    logger.info(f"Running: {' '.join(alembic_args)}")

    try:
        result = subprocess.run(
            alembic_args,
            check=True,
            capture_output=True,
            text=True
        )

        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        return True

    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}")
        if e.stdout:
            print(e.stdout)
        if e.stderr:
            print(e.stderr, file=sys.stderr)
        return False
    except FileNotFoundError:
        logger.error("Alembic command not found. Is it installed?")
        logger.error("Install with: pip install -r requirements-database.txt")
        return False


def upgrade(target='head'):
    """Upgrade database to target version"""
    logger.info(f"Upgrading database to: {target}")
    return run_alembic_command(f'upgrade {target}')


def downgrade(target='-1'):
    """Downgrade database to target version"""
    logger.info(f"Downgrading database to: {target}")

    # Confirm before downgrading
    confirm = input(f"⚠️  This will downgrade the database. Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        logger.info("Downgrade cancelled")
        return False

    return run_alembic_command(f'downgrade {target}')


def current():
    """Show current database version"""
    logger.info("Getting current database version...")
    return run_alembic_command('current')


def history():
    """Show migration history"""
    logger.info("Getting migration history...")
    return run_alembic_command('history --verbose')


def revision(message, autogenerate=False):
    """Create a new migration"""
    logger.info(f"Creating new migration: {message}")

    if autogenerate:
        return run_alembic_command(f'revision --autogenerate -m "{message}"')
    else:
        return run_alembic_command(f'revision -m "{message}"')


def stamp(revision='head'):
    """Stamp database with a specific revision"""
    logger.info(f"Stamping database with revision: {revision}")

    confirm = input(f"⚠️  This will mark the database as version {revision} without running migrations. Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        logger.info("Stamp cancelled")
        return False

    return run_alembic_command(f'stamp {revision}')


def show_sql(direction='upgrade', target='head'):
    """Show SQL for migration without applying"""
    logger.info(f"Showing SQL for {direction} to {target}")
    return run_alembic_command(f'{direction} {target} --sql')


def print_usage():
    """Print usage instructions"""
    print("""
Database Migration Runner for RTO Prediction System
====================================================

Usage:
    python scripts/run_migrations.py <command> [options]

Commands:
    upgrade [revision]     Upgrade to revision (default: head/latest)
    downgrade [revision]   Downgrade to revision (default: -1/previous)
    current                Show current database version
    history                Show migration history
    revision <message>     Create new migration
    autogen <message>      Auto-generate migration from model changes
    stamp [revision]       Mark database as specific version without migrating
    sql-up [revision]      Show upgrade SQL without applying
    sql-down [revision]    Show downgrade SQL without applying
    help                   Show this help message

Examples:
    # Upgrade to latest version
    python scripts/run_migrations.py upgrade

    # Upgrade to specific revision
    python scripts/run_migrations.py upgrade abc123

    # Downgrade by one version
    python scripts/run_migrations.py downgrade

    # Downgrade to specific revision
    python scripts/run_migrations.py downgrade xyz789

    # Downgrade all the way
    python scripts/run_migrations.py downgrade base

    # Show current version
    python scripts/run_migrations.py current

    # Show migration history
    python scripts/run_migrations.py history

    # Create new migration
    python scripts/run_migrations.py revision "add user table"

    # Auto-generate migration
    python scripts/run_migrations.py autogen "update prediction fields"

    # Show SQL for upgrade
    python scripts/run_migrations.py sql-up

Environment Variables:
    DATABASE_URL    PostgreSQL connection string
                   Format: postgresql://user:password@host:port/database

Prerequisites:
    pip install -r requirements-database.txt

Documentation:
    See alembic/README.md for detailed migration guide
""")


def main():
    """Main entry point"""

    # Check if Alembic is installed
    if not check_alembic_installed():
        logger.error("Alembic is not installed!")
        logger.error("Install with: pip install -r requirements-database.txt")
        sys.exit(1)

    # Parse command
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1].lower()
    args = sys.argv[2:] if len(sys.argv) > 2 else []

    # Execute command
    success = False

    if command == 'upgrade':
        target = args[0] if args else 'head'
        success = upgrade(target)

    elif command == 'downgrade':
        target = args[0] if args else '-1'
        success = downgrade(target)

    elif command == 'current':
        success = current()

    elif command == 'history':
        success = history()

    elif command == 'revision':
        if not args:
            logger.error("Migration message required")
            logger.error("Usage: python scripts/run_migrations.py revision <message>")
            sys.exit(1)
        success = revision(args[0], autogenerate=False)

    elif command == 'autogen' or command == 'autogenerate':
        if not args:
            logger.error("Migration message required")
            logger.error("Usage: python scripts/run_migrations.py autogen <message>")
            sys.exit(1)
        success = revision(args[0], autogenerate=True)

    elif command == 'stamp':
        target = args[0] if args else 'head'
        success = stamp(target)

    elif command == 'sql-up':
        target = args[0] if args else 'head'
        success = show_sql('upgrade', target)

    elif command == 'sql-down':
        target = args[0] if args else '-1'
        success = show_sql('downgrade', target)

    elif command == 'help' or command == '--help' or command == '-h':
        print_usage()
        sys.exit(0)

    else:
        logger.error(f"Unknown command: {command}")
        print_usage()
        sys.exit(1)

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
