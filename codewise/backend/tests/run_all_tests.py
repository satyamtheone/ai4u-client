#!/usr/bin/env python3
"""
Integration Test Runner with Cleanup

This script runs all integration tests and performs cleanup afterwards.
Cross-platform Python version of run_all_tests.sh

Usage:
    python tests/run_all_tests.py
    python tests/run_all_tests.py --skip-cleanup
    python tests/run_all_tests.py --cleanup-only
"""

import sys
import subprocess
import requests
from sqlalchemy import create_engine
import os
import argparse


# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color


def print_header(message):
    """Print colored header"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}  {message}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}\n")


def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.NC}")


def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}✗ {message}{Colors.NC}")


def print_warning(message):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.NC}")


def print_info(message):
    """Print info message"""
    print(f"{Colors.YELLOW}{message}{Colors.NC}")


def check_api_server():
    """Check if API server is running"""
    print_info("Checking if API server is running...")
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            print_success("API server is running")
            return True
    except requests.exceptions.ConnectionError:
        pass

    print_error("API server is not running")
    print_info("Please start the API server first:")
    print("  cd backend")
    print("  python codewise_app.py")
    return False


def check_database():
    """Check database connection"""
    print_info("Checking database connection...")

    db_url = os.getenv(
        'TEST_DATABASE_URL',
        'postgresql://postgres:postgres123@localhost:5432/multitenancy_app'
    )

    try:
        engine = create_engine(db_url)
        conn = engine.connect()
        conn.close()
        print_success("Database connection successful")
        return True
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        return False


def run_integration_tests():
    """Run all integration tests except cleanup"""
    print_header("Running Integration Tests")
    print_info("Running all integration tests...")

    cmd = [
        "pytest",
        "tests/",
        "--ignore=tests/test_cleanup.py",
        "-v",
        "-s"
    ]

    result = subprocess.run(cmd, cwd=os.path.dirname(os.path.dirname(__file__)))
    return result.returncode


def run_cleanup():
    """Run cleanup tests"""
    print_header("Running Cleanup")
    print_info("Cleaning up test data...")

    cmd = [
        "pytest",
        "tests/test_cleanup.py",
        "-v",
        "-s"
    ]

    result = subprocess.run(cmd, cwd=os.path.dirname(os.path.dirname(__file__)))
    return result.returncode


def run_cleanup_script():
    """Run cleanup as a standalone script"""
    print_header("Running Cleanup Script")
    print_info("Cleaning up test data...")

    try:
        # Import and run cleanup function
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from tests.test_cleanup import cleanup_all_test_data

        cleanup_all_test_data()
        print_success("Cleanup completed successfully")
        return 0
    except Exception as e:
        print_error(f"Cleanup failed: {e}")
        return 1


def main():
    """Main test runner"""
    parser = argparse.ArgumentParser(description="Run integration tests with cleanup")
    parser.add_argument(
        '--skip-cleanup',
        action='store_true',
        help='Skip cleanup after tests'
    )
    parser.add_argument(
        '--cleanup-only',
        action='store_true',
        help='Run cleanup only (skip tests)'
    )
    parser.add_argument(
        '--no-checks',
        action='store_true',
        help='Skip API and database checks'
    )

    args = parser.parse_args()

    print_header("Backend Integration Test Suite")

    # Pre-flight checks
    if not args.no_checks and not args.cleanup_only:
        if not check_api_server():
            return 1

        if not check_database():
            return 1

    test_exit_code = 0
    cleanup_exit_code = 0

    # Run tests
    if not args.cleanup_only:
        test_exit_code = run_integration_tests()

        print()
        if test_exit_code == 0:
            print_success("All tests passed")
        else:
            print_error(f"Some tests failed (exit code: {test_exit_code})")

    # Run cleanup
    if not args.skip_cleanup:
        cleanup_exit_code = run_cleanup()

        print()
        if cleanup_exit_code == 0:
            print_success("Cleanup completed successfully")
        else:
            print_warning("Cleanup completed with warnings")

    # Print summary
    print_header("Test Summary")

    if not args.cleanup_only:
        if test_exit_code == 0:
            print_success("Integration Tests: PASSED")
        else:
            print_error("Integration Tests: FAILED")

    if not args.skip_cleanup:
        if cleanup_exit_code == 0:
            print_success("Cleanup: COMPLETED")
        else:
            print_warning("Cleanup: COMPLETED WITH WARNINGS")

    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}\n")

    # Exit with test exit code (not cleanup code)
    return test_exit_code if not args.cleanup_only else cleanup_exit_code


if __name__ == "__main__":
    sys.exit(main())
