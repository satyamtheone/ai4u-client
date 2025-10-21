#!/bin/bash

# Integration Test Runner with Cleanup
# This script runs all integration tests and performs cleanup afterwards

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Backend Integration Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if API server is running
echo -e "${YELLOW}Checking if API server is running...${NC}"
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API server is running${NC}"
else
    echo -e "${RED}✗ API server is not running${NC}"
    echo -e "${YELLOW}Please start the API server first:${NC}"
    echo "  cd backend"
    echo "  python codewise_app.py"
    exit 1
fi

# Check database connection
echo -e "${YELLOW}Checking database connection...${NC}"
python -c "
from sqlalchemy import create_engine
import os
db_url = os.getenv('TEST_DATABASE_URL', 'postgresql://postgres:postgres123@localhost:5432/multitenancy_app')
try:
    engine = create_engine(db_url)
    conn = engine.connect()
    conn.close()
    print('✓ Database connection successful')
except Exception as e:
    print(f'✗ Database connection failed: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo -e "${RED}Database connection failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Running Integration Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Run all tests except cleanup
echo -e "${YELLOW}Running all integration tests...${NC}"
pytest tests/ --ignore=tests/test_cleanup.py -v -s

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Some tests failed (exit code: $TEST_EXIT_CODE)${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Running Cleanup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Run cleanup tests
echo -e "${YELLOW}Cleaning up test data...${NC}"
pytest tests/test_cleanup.py -v -s

CLEANUP_EXIT_CODE=$?

echo ""
if [ $CLEANUP_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Cleanup completed successfully${NC}"
else
    echo -e "${YELLOW}⚠ Cleanup completed with warnings${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Integration Tests: PASSED${NC}"
else
    echo -e "${RED}Integration Tests: FAILED${NC}"
fi

if [ $CLEANUP_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Cleanup: COMPLETED${NC}"
else
    echo -e "${YELLOW}Cleanup: COMPLETED WITH WARNINGS${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo ""

# Exit with test exit code (not cleanup code)
exit $TEST_EXIT_CODE
