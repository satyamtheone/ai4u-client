// Connection Debug Helper
// Use this to debug backend connection issues

export const testBackendConnection = async (backendUrl: string) => {
  console.group('🔌 Testing Backend Connection');
  console.log('Backend URL:', backendUrl);

  // Test 1: Basic fetch to health endpoint
  try {
    console.log('Test 1: Health endpoint check...');
    const response = await fetch(`${backendUrl}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    console.log('Status:', response.status);
    console.log('OK:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed:', data);
      console.log('Backend version:', data.version || 'unknown');
      console.log('Features:', data.features || []);
    } else {
      console.error('❌ Health check failed with status:', response.status);
    }
  } catch (error: any) {
    console.error('❌ Health check error:', error.message);

    if (error.name === 'AbortError') {
      console.error('→ Request timed out. Backend might be down or unreachable.');
    } else if (error.message.includes('Failed to fetch')) {
      console.error('→ Network error. Possible causes:');
      console.error('  1. Backend is not running');
      console.error('  2. Wrong URL/port');
      console.error('  3. CORS issue');
      console.error('  4. Firewall blocking connection');
    }
  }

  // Test 2: Check if URL is reachable (simple ping)
  try {
    console.log('\nTest 2: Basic connectivity check...');
    const response = await fetch(backendUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    });
    console.log('✅ Backend is reachable');
  } catch (error) {
    console.error('❌ Backend is not reachable');
  }

  // Test 3: CORS check
  console.log('\nTest 3: CORS headers check...');
  console.log('Current origin:', window.location.origin);
  console.log('Backend URL:', backendUrl);

  if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
    console.log('ℹ️ Local backend - CORS should work');
  } else {
    console.log('⚠️ Remote backend - ensure CORS is configured to allow:', window.location.origin);
  }

  console.groupEnd();
};

// Quick test function for browser console
(window as any).testBackend = () => {
  const url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  testBackendConnection(url);
};

console.log('💡 Tip: Run testBackend() in console to debug backend connection');
