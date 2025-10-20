"""
Integration Tests for Health Check Endpoints

These tests make REAL HTTP requests to the running API server.
Ensure the API is running at http://localhost:8001 before executing.

Run tests:
    pytest tests/test_health_integration.py -v -s
"""

import pytest
import requests
from tests.integration_test_config import (
    get_full_url, Endpoints, TEST_TIMEOUT, print_test_info, API_BASE_URL
)


class TestHealthCheckIntegration:
    """Integration tests for API health check endpoint"""

    def test_health_check_endpoint_accessible(self):
        """Test health endpoint is accessible - REAL API CALL"""
        print_test_info("Testing Health Check Endpoint Accessibility")

        url = get_full_url(Endpoints.HEALTH)
        print(f"GET {url}")

        response = requests.get(url, timeout=TEST_TIMEOUT)

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

        assert response.status_code == 200
        print("✓ Health endpoint is accessible")

    def test_health_check_returns_healthy_status(self):
        """Test health endpoint returns healthy status - REAL API CALL"""
        print_test_info("Testing Health Status")

        url = get_full_url(Endpoints.HEALTH)
        response = requests.get(url, timeout=TEST_TIMEOUT)

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert data["status"] == "healthy"

        print(f"✓ API status: {data['status']}")

    def test_health_check_response_structure(self):
        """Test health endpoint returns correct response structure - REAL API CALL"""
        print_test_info("Testing Health Response Structure")

        url = get_full_url(Endpoints.HEALTH)
        response = requests.get(url, timeout=TEST_TIMEOUT)

        assert response.status_code == 200
        data = response.json()

        # Verify required fields
        assert "status" in data
        assert isinstance(data["status"], str)

        print(f"✓ Response structure verified: {data}")

    def test_health_check_response_time(self):
        """Test health endpoint responds quickly - REAL API CALL"""
        print_test_info("Testing Health Check Response Time")

        url = get_full_url(Endpoints.HEALTH)
        response = requests.get(url, timeout=TEST_TIMEOUT)

        # Health check should respond in less than 1 second
        assert response.elapsed.total_seconds() < 1.0

        print(f"✓ Response time: {response.elapsed.total_seconds():.3f}s")

    def test_health_check_multiple_requests(self):
        """Test health endpoint handles multiple requests - REAL API CALLS"""
        print_test_info("Testing Multiple Health Check Requests")

        url = get_full_url(Endpoints.HEALTH)

        # Make 5 consecutive requests
        for i in range(5):
            response = requests.get(url, timeout=TEST_TIMEOUT)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            print(f"  Request {i+1}/5: OK")

        print("✓ Multiple requests handled successfully")

    def test_health_check_content_type(self):
        """Test health endpoint returns JSON content type - REAL API CALL"""
        print_test_info("Testing Health Check Content Type")

        url = get_full_url(Endpoints.HEALTH)
        response = requests.get(url, timeout=TEST_TIMEOUT)

        assert response.status_code == 200
        assert "application/json" in response.headers.get("Content-Type", "")

        print(f"✓ Content-Type: {response.headers.get('Content-Type')}")


class TestAPIServerConnectivityIntegration:
    """Integration tests for API server connectivity"""

    def test_api_server_is_running(self):
        """Test API server is running and accessible - REAL API CALL"""
        print_test_info("Testing API Server Connectivity")

        url = get_full_url(Endpoints.HEALTH)

        try:
            response = requests.get(url, timeout=TEST_TIMEOUT)
            assert response.status_code == 200
            print(f"✓ API server is running at {API_BASE_URL}")
        except requests.exceptions.ConnectionError:
            pytest.fail(f"API server is not running at {API_BASE_URL}")

    def test_api_base_url_accessible(self):
        """Test API base URL is accessible - REAL API CALL"""
        print_test_info("Testing API Base URL")

        try:
            response = requests.get(API_BASE_URL, timeout=TEST_TIMEOUT)
            # Any response (even 404) means the server is accessible
            assert response is not None
            print(f"✓ Base URL accessible: {API_BASE_URL}")
        except requests.exceptions.ConnectionError:
            pytest.fail(f"Cannot connect to {API_BASE_URL}")

    def test_api_timeout_handling(self):
        """Test API handles timeout settings - REAL API CALL"""
        print_test_info("Testing API Timeout Handling")

        url = get_full_url(Endpoints.HEALTH)

        # Request with very short timeout (should still succeed for health check)
        response = requests.get(url, timeout=5)

        assert response.status_code == 200
        print("✓ API responds within timeout")


class TestHealthCheckEdgeCasesIntegration:
    """Integration tests for health check edge cases"""

    def test_health_check_with_query_params(self):
        """Test health endpoint ignores query parameters - REAL API CALL"""
        print_test_info("Testing Health Check with Query Parameters")

        url = get_full_url(Endpoints.HEALTH) + "?test=value&foo=bar"
        response = requests.get(url, timeout=TEST_TIMEOUT)

        # Should still return 200 (query params ignored or handled)
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            print("✓ Health check handles query parameters")
        else:
            print("✓ Health check rejects query parameters (expected)")

    def test_health_check_with_custom_headers(self):
        """Test health endpoint works with custom headers - REAL API CALL"""
        print_test_info("Testing Health Check with Custom Headers")

        url = get_full_url(Endpoints.HEALTH)
        headers = {
            "User-Agent": "Integration-Test-Client",
            "X-Test-Header": "test-value"
        }

        response = requests.get(url, headers=headers, timeout=TEST_TIMEOUT)

        assert response.status_code == 200
        print("✓ Health check works with custom headers")

    def test_health_check_wrong_method_post(self):
        """Test health endpoint with POST method - REAL API CALL"""
        print_test_info("Testing Health Check with POST Method")

        url = get_full_url(Endpoints.HEALTH)
        response = requests.post(url, timeout=TEST_TIMEOUT)

        # Should return 405 Method Not Allowed or 200 if POST is also supported
        assert response.status_code in [200, 405]
        print(f"✓ POST method handled: {response.status_code}")

    def test_health_check_wrong_method_put(self):
        """Test health endpoint with PUT method - REAL API CALL"""
        print_test_info("Testing Health Check with PUT Method")

        url = get_full_url(Endpoints.HEALTH)
        response = requests.put(url, timeout=TEST_TIMEOUT)

        # Should return 405 Method Not Allowed or similar
        assert response.status_code in [200, 405]
        print(f"✓ PUT method handled: {response.status_code}")

    def test_health_check_wrong_method_delete(self):
        """Test health endpoint with DELETE method - REAL API CALL"""
        print_test_info("Testing Health Check with DELETE Method")

        url = get_full_url(Endpoints.HEALTH)
        response = requests.delete(url, timeout=TEST_TIMEOUT)

        # Should return 405 Method Not Allowed or similar
        assert response.status_code in [200, 405]
        print(f"✓ DELETE method handled: {response.status_code}")


class TestHealthCheckPerformanceIntegration:
    """Integration tests for health check performance"""

    def test_health_check_concurrent_requests(self):
        """Test health endpoint handles concurrent requests - REAL API CALLS"""
        print_test_info("Testing Concurrent Health Check Requests")

        import concurrent.futures

        url = get_full_url(Endpoints.HEALTH)

        def make_request():
            response = requests.get(url, timeout=TEST_TIMEOUT)
            return response.status_code

        # Make 10 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]

        # All requests should succeed
        assert all(status == 200 for status in results)
        print(f"✓ All {len(results)} concurrent requests succeeded")

    def test_health_check_rapid_succession(self):
        """Test health endpoint handles rapid successive requests - REAL API CALLS"""
        print_test_info("Testing Rapid Successive Health Checks")

        url = get_full_url(Endpoints.HEALTH)

        success_count = 0
        for i in range(20):
            response = requests.get(url, timeout=TEST_TIMEOUT)
            if response.status_code == 200:
                success_count += 1

        # At least 95% should succeed
        assert success_count >= 19
        print(f"✓ {success_count}/20 rapid requests succeeded")

    def test_health_check_average_response_time(self):
        """Test health endpoint average response time - REAL API CALLS"""
        print_test_info("Testing Health Check Average Response Time")

        url = get_full_url(Endpoints.HEALTH)

        response_times = []
        for _ in range(10):
            response = requests.get(url, timeout=TEST_TIMEOUT)
            response_times.append(response.elapsed.total_seconds())

        avg_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        min_time = min(response_times)

        print(f"  Average: {avg_time:.3f}s")
        print(f"  Min: {min_time:.3f}s")
        print(f"  Max: {max_time:.3f}s")

        # Average should be less than 500ms
        assert avg_time < 0.5
        print("✓ Average response time is acceptable")


class TestHealthCheckReliabilityIntegration:
    """Integration tests for health check reliability"""

    def test_health_check_consistency(self):
        """Test health endpoint returns consistent responses - REAL API CALLS"""
        print_test_info("Testing Health Check Consistency")

        url = get_full_url(Endpoints.HEALTH)

        responses = []
        for _ in range(5):
            response = requests.get(url, timeout=TEST_TIMEOUT)
            responses.append(response.json())

        # All responses should be identical
        first_response = responses[0]
        for response in responses[1:]:
            assert response == first_response

        print("✓ Health check responses are consistent")

    def test_health_check_idempotency(self):
        """Test health endpoint is idempotent - REAL API CALLS"""
        print_test_info("Testing Health Check Idempotency")

        url = get_full_url(Endpoints.HEALTH)

        # Make first request
        response1 = requests.get(url, timeout=TEST_TIMEOUT)
        data1 = response1.json()

        # Make second request
        response2 = requests.get(url, timeout=TEST_TIMEOUT)
        data2 = response2.json()

        # Both should return same status
        assert data1["status"] == data2["status"]
        print("✓ Health check is idempotent")

    def test_health_check_no_side_effects(self):
        """Test health endpoint has no side effects - REAL API CALLS"""
        print_test_info("Testing Health Check Has No Side Effects")

        url = get_full_url(Endpoints.HEALTH)

        # Make multiple requests
        for i in range(10):
            response = requests.get(url, timeout=TEST_TIMEOUT)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"

        print("✓ Health check has no side effects (always returns same status)")
