"""
API Testing Script for RTO Predictor API
Tests all endpoints with sample data
"""

import requests
import json
import time
from typing import Dict, Any
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8002"
TIMEOUT = 30

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

def print_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")

def print_info(message: str):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ {message}{Colors.RESET}")

def print_warning(message: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")

def print_section(title: str):
    """Print section header"""
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{Colors.RESET}\n")


# Sample order data
SAMPLE_ORDER = {
    "ORDER_NUMBER": "TEST_ORD_001",
    "CLIENT_NAME": "Test Client",
    "CUSTOMER_NAME": "John Doe",
    "CUSTOMER_PHONE": "9876543210",
    "CUSTOMER_ADDRESS": "123 Test Street, Sector 15, Near Metro Station",
    "CUSTOMER_CITY": "GURGAON",
    "CUSTOMER_STATE": "HARYANA",
    "PINCODE": "122001",
    "PAYMENT_MODE": "COD",
    "COURIER_NAME": "DELHIVERY",
    "ITEM_DESCRIPTION": "Electronics - Mobile Phone",
    "WEIGHT": 1.5,
    "QTY": 2,
    "INVOICE_VALUE": 2499.50,
    "ORDER_CREATION_DATE": datetime.now().isoformat(),
    "COLLECTABLE_AMOUNT": 2499.50,
    "ZONE": "North"
}


def test_endpoint(name: str, method: str, url: str, **kwargs) -> Dict[str, Any]:
    """Generic endpoint tester"""
    try:
        print_info(f"Testing: {name}")
        print(f"  Method: {method}")
        print(f"  URL: {url}")

        start_time = time.time()

        if method.upper() == "GET":
            response = requests.get(url, timeout=TIMEOUT, **kwargs)
        elif method.upper() == "POST":
            response = requests.post(url, timeout=TIMEOUT, **kwargs)
        elif method.upper() == "DELETE":
            response = requests.delete(url, timeout=TIMEOUT, **kwargs)
        else:
            raise ValueError(f"Unsupported method: {method}")

        elapsed = time.time() - start_time

        response.raise_for_status()
        result = response.json()

        print_success(f"Status: {response.status_code}")
        print(f"  Response time: {elapsed:.2f}s")
        print(f"  Response preview: {json.dumps(result, indent=2)[:200]}...")

        return {
            "success": True,
            "status_code": response.status_code,
            "response": result,
            "elapsed": elapsed
        }

    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"  Error detail: {json.dumps(error_detail, indent=2)}")
            except:
                print(f"  Error text: {e.response.text[:200]}")

        return {
            "success": False,
            "error": str(e)
        }

    except Exception as e:
        print_error(f"Unexpected error: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def main():
    """Run all API tests"""

    print(f"\n{Colors.BLUE}{'='*60}")
    print("  RTO PREDICTOR API TEST SUITE")
    print(f"{'='*60}{Colors.RESET}")
    print(f"\nBase URL: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    results = {}

    # ========================================================================
    # 1. INFO ENDPOINTS
    # ========================================================================
    print_section("1. INFO ENDPOINTS")

    # Test root endpoint
    results['root'] = test_endpoint(
        "Root Endpoint",
        "GET",
        f"{BASE_URL}/"
    )

    # Test info endpoint
    results['info'] = test_endpoint(
        "API Info",
        "GET",
        f"{BASE_URL}/api/v1/info"
    )

    # ========================================================================
    # 2. HEALTH & MONITORING ENDPOINTS
    # ========================================================================
    print_section("2. HEALTH & MONITORING ENDPOINTS")

    # Test health endpoint
    results['health'] = test_endpoint(
        "Health Check",
        "GET",
        f"{BASE_URL}/health"
    )

    # Test metrics endpoint
    results['metrics'] = test_endpoint(
        "System Metrics",
        "GET",
        f"{BASE_URL}/api/v1/metrics"
    )

    # Test status endpoint
    results['status'] = test_endpoint(
        "System Status",
        "GET",
        f"{BASE_URL}/api/v1/status"
    )

    # Check if model is loaded
    if results['status']['success']:
        model_loaded = results['status']['response'].get('model_loaded', False)
        if model_loaded:
            print_success("Model is loaded and ready")
        else:
            print_warning("Model not loaded - prediction tests will be skipped")
            print_info("To test predictions, first train a model using POST /api/v1/train")

    # ========================================================================
    # 3. PREDICTION ENDPOINTS (Only if model is loaded)
    # ========================================================================
    if results['status']['success'] and results['status']['response'].get('model_loaded', False):
        print_section("3. PREDICTION ENDPOINTS")

        # Test single prediction
        results['predict_single'] = test_endpoint(
            "Single Order Prediction",
            "POST",
            f"{BASE_URL}/api/v1/predict",
            json=SAMPLE_ORDER
        )

        # Test batch prediction
        batch_request = {
            "orders": [SAMPLE_ORDER, SAMPLE_ORDER, SAMPLE_ORDER],
            "batch_size": 100
        }

        results['predict_batch'] = test_endpoint(
            "Batch Prediction (3 orders)",
            "POST",
            f"{BASE_URL}/api/v1/predict/batch",
            json=batch_request
        )

        # Note about CSV prediction
        print_info("CSV Prediction Test")
        print("  This test requires a CSV file")
        print("  To test: curl -X POST http://localhost:8002/api/v1/predict/csv -F 'file=@data.csv'")

    else:
        print_section("3. PREDICTION ENDPOINTS")
        print_warning("Skipping prediction tests - model not loaded")

    # ========================================================================
    # 4. MODEL MANAGEMENT ENDPOINTS
    # ========================================================================
    print_section("4. MODEL MANAGEMENT ENDPOINTS")

    # Test model info (if model loaded)
    if results['status']['success'] and results['status']['response'].get('model_loaded', False):
        results['model_info'] = test_endpoint(
            "Model Information",
            "GET",
            f"{BASE_URL}/api/v1/model/info"
        )
    else:
        print_warning("Skipping model info test - model not loaded")

    # Note about training
    print_info("Model Training Test")
    print("  Training requires a CSV file with CURRENT_STATUS column")
    print("  To test: curl -X POST http://localhost:8002/api/v1/train -F 'file=@training_data.csv'")

    # Note about retraining
    print_info("Model Retraining Test")
    print("  Retraining requires an existing trained model")
    print("  To test: curl -X POST http://localhost:8002/api/v1/retrain -F 'file=@new_data.csv'")

    # ========================================================================
    # 5. ANALYTICS ENDPOINTS (Only if model is loaded)
    # ========================================================================
    if results['status']['success'] and results['status']['response'].get('model_loaded', False):
        print_section("5. ANALYTICS ENDPOINTS")

        # Test courier performance
        results['courier_performance'] = test_endpoint(
            "Courier Performance Analysis",
            "GET",
            f"{BASE_URL}/api/v1/analytics/courier-performance"
        )

        # Test pincode analysis (all pincodes)
        results['pincode_all'] = test_endpoint(
            "Pincode Analysis (All)",
            "GET",
            f"{BASE_URL}/api/v1/analytics/pincode"
        )

        # Test pincode analysis (specific pincode)
        results['pincode_specific'] = test_endpoint(
            "Pincode Analysis (122001)",
            "GET",
            f"{BASE_URL}/api/v1/analytics/pincode/122001"
        )

    else:
        print_section("5. ANALYTICS ENDPOINTS")
        print_warning("Skipping analytics tests - model not loaded")

    # ========================================================================
    # 6. REPORTS ENDPOINTS (Only if model is loaded)
    # ========================================================================
    if results['status']['success'] and results['status']['response'].get('model_loaded', False):
        print_section("6. REPORTS ENDPOINTS")

        # Test performance report
        results['performance_report'] = test_endpoint(
            "Performance Report",
            "GET",
            f"{BASE_URL}/api/v1/reports/performance"
        )

    else:
        print_section("6. REPORTS ENDPOINTS")
        print_warning("Skipping reports tests - model not loaded")

    # ========================================================================
    # 7. MANAGEMENT ENDPOINTS
    # ========================================================================
    print_section("7. MANAGEMENT ENDPOINTS")

    # Test backup creation
    results['create_backup'] = test_endpoint(
        "Create Backup",
        "POST",
        f"{BASE_URL}/api/v1/backup"
    )

    # Test list backups
    results['list_backups'] = test_endpoint(
        "List Backups",
        "GET",
        f"{BASE_URL}/api/v1/backups"
    )

    # Note about restore
    print_info("Restore Backup Test")
    print("  Restoring requires an existing backup")
    print("  To test: curl -X POST http://localhost:8002/api/v1/restore/{backup_name}")

    # Note about cleanup
    print_info("Cleanup Backups Test")
    print("  Cleanup removes old backups, keeping most recent N")
    print("  To test: curl -X DELETE http://localhost:8002/api/v1/backups/cleanup?max_backups=5")

    # ========================================================================
    # SUMMARY
    # ========================================================================
    print_section("TEST SUMMARY")

    total_tests = len(results)
    successful_tests = sum(1 for r in results.values() if r.get('success', False))
    failed_tests = total_tests - successful_tests

    print(f"Total Tests: {total_tests}")
    print_success(f"Passed: {successful_tests}")
    if failed_tests > 0:
        print_error(f"Failed: {failed_tests}")

    print(f"\nSuccess Rate: {successful_tests/total_tests*100:.1f}%")

    # Detailed results
    print("\n" + "="*60)
    print("DETAILED RESULTS")
    print("="*60 + "\n")

    for test_name, result in results.items():
        status = "✓ PASS" if result.get('success') else "✗ FAIL"
        color = Colors.GREEN if result.get('success') else Colors.RED
        print(f"{color}{status}{Colors.RESET} - {test_name}")

        if result.get('success'):
            if 'elapsed' in result:
                print(f"      Response time: {result['elapsed']:.2f}s")
        else:
            if 'error' in result:
                print(f"      Error: {result['error']}")

    # Additional notes
    print("\n" + "="*60)
    print("ADDITIONAL NOTES")
    print("="*60 + "\n")

    print("To run file upload tests:")
    print("  1. Training: curl -X POST http://localhost:8002/api/v1/train -F 'file=@training_data.csv'")
    print("  2. CSV Prediction: curl -X POST http://localhost:8002/api/v1/predict/csv -F 'file=@orders.csv'")
    print("  3. Validation: curl -X POST http://localhost:8002/api/v1/validate -F 'predictions_file=@pred.csv' -F 'actual_outcomes_file=@actual.csv'")

    print("\nTo view interactive API documentation:")
    print(f"  Swagger UI: {BASE_URL}/docs")
    print(f"  ReDoc: {BASE_URL}/redoc")

    print(f"\n{Colors.BLUE}{'='*60}")
    print("  TEST SUITE COMPLETED")
    print(f"{'='*60}{Colors.RESET}\n")

    return results


if __name__ == "__main__":
    try:
        results = main()

        # Exit with appropriate code
        failed = sum(1 for r in results.values() if not r.get('success', False))
        exit(0 if failed == 0 else 1)

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.RESET}")
        exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}Test suite failed with error: {e}{Colors.RESET}")
        exit(1)
