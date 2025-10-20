# Backend Integration Test Suite

Comprehensive integration test suite for Individual and Organization user registration flows.
**All tests make REAL HTTP requests to the running API server** - no mocks!

## Test Files

### `test_individual_integration.py`
Integration tests for individual user registration:
- ✅ Successful registration (minimal and full fields)
- ✅ AccountType creation and verification
- ✅ Role assignment (individual_user)
- ✅ Input validation (email, password, names)
- ✅ Duplicate email handling
- ✅ Edge cases (unicode, special characters, case sensitivity)
- ✅ Default values

**Test Classes:**
- `TestIndividualRegistrationIntegration` - Core registration functionality (4 tests)
- `TestIndividualRegistrationValidationIntegration` - Input validation (4 tests)
- `TestIndividualRegistrationEdgeCasesIntegration` - Edge cases (4 tests)

**Total:** 12 integration tests

### `test_organization_integration.py`
Integration tests for organization admin registration:
- ✅ Organization creation with admin user
- ✅ AccountType creation (organization_member)
- ✅ Role assignment (org_admin)
- ✅ Organization slug generation
- ✅ User-organization linking
- ✅ Duplicate organization slug handling
- ✅ Transaction rollback on failure
- ✅ Edge cases (unicode, special characters in org names)

**Test Classes:**
- `TestOrganizationRegistrationIntegration` - Core organization registration (5 tests)
- `TestOrganizationRegistrationSlugIntegration` - Slug generation (3 tests)
- `TestOrganizationRegistrationValidationIntegration` - Validation rules (4 tests)
- `TestOrganizationRegistrationRollbackIntegration` - Transaction integrity (1 test)

**Total:** 13 integration tests

### `test_health_integration.py`
Integration tests for API health check and server connectivity:
- ✅ Health endpoint accessibility
- ✅ Healthy status verification
- ✅ Response structure validation
- ✅ Response time performance
- ✅ Multiple concurrent requests
- ✅ Content type verification
- ✅ Server connectivity tests
- ✅ Edge cases (query params, headers, HTTP methods)
- ✅ Performance tests (concurrent, rapid succession)
- ✅ Reliability tests (consistency, idempotency)

**Test Classes:**
- `TestHealthCheckIntegration` - Core health check functionality (6 tests)
- `TestAPIServerConnectivityIntegration` - Server connectivity (3 tests)
- `TestHealthCheckEdgeCasesIntegration` - Edge cases (5 tests)
- `TestHealthCheckPerformanceIntegration` - Performance tests (3 tests)
- `TestHealthCheckReliabilityIntegration` - Reliability tests (3 tests)

**Total:** 20 integration tests

### `integration_test_config.py`
Configuration for integration tests:
- API base URL configuration
- Database connection for verification
- Endpoint definitions
- Helper functions (generate_unique_email, print_test_info)
- Test data generators

## Prerequisites

### 1. Start the API Server

The integration tests require the API server to be running:

```bash
# From the backend directory
cd backend

# Start the API server
python codewise_app.py
```

The server should be running at `http://localhost:8001` (default)

### 2. Ensure Database is Running

The tests require PostgreSQL database:

```bash
# If using Docker
docker-compose up -d postgres

# Or start your local PostgreSQL server
```

Default database connection:
```
postgresql://postgres:postgres123@localhost:5432/multitenancy_app
```

### 3. Ensure Redis is Running (if required by app)

```bash
# If using Docker
docker-compose up -d redis

# Or start your local Redis server
```

### 4. Install Test Dependencies

```bash
pip install pytest requests sqlalchemy psycopg2-binary
```

## Running Tests

### Run All Integration Tests

```bash
# From backend directory
cd backend

# Run all integration tests
pytest tests/ -v

# Run with detailed output
pytest tests/ -v -s
```

### Run Individual Tests Only

```bash
# Test individual user registration
pytest tests/test_individual_integration.py -v -s
```

### Run Organization Tests Only

```bash
# Test organization admin registration
pytest tests/test_organization_integration.py -v -s
```

### Run Health Check Tests Only

```bash
# Test API health check and connectivity
pytest tests/test_health_integration.py -v -s
```

### Run Specific Test Classes

```bash
# Run individual registration core tests
pytest tests/test_individual_integration.py::TestIndividualRegistrationIntegration -v

# Run organization slug generation tests
pytest tests/test_organization_integration.py::TestOrganizationRegistrationSlugIntegration -v
```

### Run Specific Test Methods

```bash
# Run a specific test
pytest tests/test_individual_integration.py::TestIndividualRegistrationIntegration::test_register_individual_minimal_fields -v -s
```

### Run Tests with Filters

```bash
# Run tests matching a pattern
pytest tests/ -k "validation" -v

# Run tests for edge cases
pytest tests/ -k "edge" -v

# Run tests for slug generation
pytest tests/ -k "slug" -v
```

## Environment Configuration

You can configure the test environment using environment variables:

```bash
# Set custom API URL
export TEST_API_BASE_URL=http://localhost:8001

# Set custom database URL
export TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/testdb

# Run tests
pytest tests/ -v
```

Or create a `.env` file in the backend directory:

```bash
# .env file
TEST_API_BASE_URL=http://localhost:8001
TEST_DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/multitenancy_app
```

## Test Output

### Successful Test Output

```
========================================
  Testing Individual Registration - Minimal Fields
========================================
POST http://localhost:8001/api/v1/auth/register
Payload: {'first_name': 'John', 'last_name': 'Doe', ...}
Status Code: 200
Response: {'success': True, 'message': 'User registered successfully', ...}
✓ Test passed - User created successfully
PASSED
```

### Failed Test Output

```
========================================
  Testing Duplicate Email Rejection
========================================
First registration: test+abc123@example.com
Second registration (duplicate): test+abc123@example.com
Status Code: 400
✓ Duplicate email correctly rejected
PASSED
```

## Test Coverage

**Individual Registration Tests:**
- ✅ 4 success scenarios with database verification
- ✅ 4 validation error scenarios
- ✅ 4 edge case scenarios

**Organization Registration Tests:**
- ✅ 5 success scenarios with database verification
- ✅ 3 slug generation scenarios
- ✅ 4 validation error scenarios
- ✅ 1 transaction rollback scenario

**Health Check Tests:**
- ✅ 6 core health check tests
- ✅ 3 server connectivity tests
- ✅ 5 edge case tests
- ✅ 3 performance tests
- ✅ 3 reliability tests

**Total:** 45 integration tests

## How Integration Tests Work

### 1. Real HTTP Requests

All tests use the `requests` library to make actual HTTP calls:

```python
import requests

url = "http://localhost:8001/api/v1/auth/register"
payload = {
    "first_name": "John",
    "email": "john@example.com",
    # ...
}
response = requests.post(url, json=payload, timeout=30)
```

### 2. Database Verification

Tests verify data in the actual PostgreSQL database:

```python
from sqlalchemy import create_engine
from models.user import User

# Connect to database
engine = create_engine(DATABASE_URL)
db = Session(engine)

# Verify user was created
user = db.query(User).filter(User.email == "john@example.com").first()
assert user is not None
```

### 3. Unique Test Data

Each test generates unique emails to avoid conflicts:

```python
from integration_test_config import generate_unique_email

email = generate_unique_email("test_prefix")
# Returns: test_prefix+abc12345@example.com
```

## Common Test Scenarios

### Individual User Registration

**Minimal Fields:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "accept_terms": true
}
```

**All Fields:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "accept_terms": true,
  "subscribe_newsletter": true,
  "timezone": "America/New_York",
  "locale": "en"
}
```

### Organization Admin Registration

**Minimal Fields:**
```json
{
  "first_name": "Admin",
  "last_name": "User",
  "email": "admin@org.com",
  "password": "SecurePass123!",
  "accept_terms": true,
  "organizationData": {
    "organizationName": "Acme Corp",
    "description": "Test organization",
    "industry": "Technology"
  }
}
```

**All Fields:**
```json
{
  "first_name": "Admin",
  "last_name": "User",
  "email": "admin@org.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "accept_terms": true,
  "organizationData": {
    "organizationName": "Acme Corp",
    "description": "We build software",
    "industry": "Technology",
    "size": "51-200",
    "website": "https://acme.com"
  }
}
```

## Troubleshooting

### Issue: Connection Refused

**Error:** `requests.exceptions.ConnectionError: Connection refused`

**Solution:** Ensure the API server is running:
```bash
python codewise_app.py
```

### Issue: Database Connection Failed

**Error:** `sqlalchemy.exc.OperationalError: could not connect to server`

**Solution:** Ensure PostgreSQL is running and connection details are correct:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Or for local PostgreSQL
pg_isready -h localhost -p 5432
```

### Issue: Tests Failing with "Role not found"

**Solution:** Ensure the database is seeded with required roles:
```bash
# Run database migrations/seeds
alembic upgrade head
```

Or ensure roles exist in the database:
- `individual_user` - for individual users
- `org_admin` - for organization admins

### Issue: Slow Test Execution

**Solution:** Run tests in parallel (requires pytest-xdist):
```bash
pip install pytest-xdist
pytest tests/ -n auto
```

## Best Practices

1. ✅ **API Must Be Running** - Always start the API server before running tests
2. ✅ **Unique Test Data** - Use `generate_unique_email()` to avoid conflicts
3. ✅ **Database Cleanup** - Tests use unique emails, no manual cleanup needed
4. ✅ **Verify Both Response and Database** - Check API response AND database state
5. ✅ **Real Scenarios** - Tests simulate actual user registration flows
6. ✅ **Error Scenarios** - Test both success and failure cases
7. ✅ **Transaction Integrity** - Verify rollback on failures

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres123
          POSTGRES_DB: multitenancy_app
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest requests

      - name: Start API Server
        run: |
          cd backend
          python codewise_app.py &
          sleep 10  # Wait for server to start

      - name: Run Integration Tests
        run: |
          cd backend
          pytest tests/ -v
        env:
          TEST_API_BASE_URL: http://localhost:8001
          TEST_DATABASE_URL: postgresql://postgres:postgres123@localhost:5432/multitenancy_app
```

## Writing New Tests

### Example: New Individual Test

```python
def test_new_feature(self, db_session):
    """Test description"""
    print_test_info("Testing New Feature")

    email = generate_unique_email("new_feature")
    payload = {
        "first_name": "Test",
        "last_name": "User",
        "email": email,
        "password": "Password123!",
        "accept_terms": True
    }

    # Make API call
    url = get_full_url(Endpoints.REGISTER)
    response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

    # Verify response
    assert response.status_code == 200

    # Verify database
    user = db_session.query(User).filter(User.email == email).first()
    assert user is not None

    print("✓ Test passed")
```

### Example: New Organization Test

```python
def test_new_org_feature(self, db_session):
    """Test description"""
    print_test_info("Testing New Organization Feature")

    email = generate_unique_email("new_org")
    org_name = f"Test Org {email.split('@')[0]}"

    payload = {
        "first_name": "Admin",
        "last_name": "User",
        "email": email,
        "password": "Password123!",
        "accept_terms": True,
        "organizationData": {
            "organizationName": org_name,
            "description": "Test",
            "industry": "Technology"
        }
    }

    # Make API call
    url = get_full_url(Endpoints.REGISTER)
    response = requests.post(url, json=payload, timeout=TEST_TIMEOUT)

    # Verify response
    assert response.status_code == 200

    # Verify organization
    org = db_session.query(Organization).filter(
        Organization.name == org_name
    ).first()
    assert org is not None

    print("✓ Test passed")
```

## Quick Start

1. **Start API Server:**
   ```bash
   cd backend
   python codewise_app.py
   ```

2. **Run All Tests:**
   ```bash
   pytest tests/ -v -s
   ```

3. **Run Individual Tests Only:**
   ```bash
   pytest tests/test_individual_integration.py -v -s
   ```

4. **Run Organization Tests Only:**
   ```bash
   pytest tests/test_organization_integration.py -v -s
   ```

## Test Results Summary

After running tests, you'll see a summary:

```
========================================
  Test Run Complete
========================================

tests/test_individual_integration.py::TestIndividualRegistrationIntegration::test_register_individual_minimal_fields PASSED
tests/test_individual_integration.py::TestIndividualRegistrationIntegration::test_register_individual_all_fields PASSED
...
tests/test_organization_integration.py::TestOrganizationRegistrationIntegration::test_register_organization_minimal_fields PASSED
...

======================== 26 passed in 45.23s ========================
```

All tests make real API calls and verify actual database state!
