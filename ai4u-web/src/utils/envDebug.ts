// Environment Variable Debug Helper
// This helps verify environment variables are loaded correctly

export const debugEnvVars = () => {
  console.group('🔍 Environment Variables Debug');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
  console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  console.log('REACT_APP_WS_URL:', process.env.REACT_APP_WS_URL);
  console.log('REACT_APP_FEATURE_LEARNING_GATES:', process.env.REACT_APP_FEATURE_LEARNING_GATES);
  console.log('REACT_APP_API_TIMEOUT:', process.env.REACT_APP_API_TIMEOUT);

  // Check if any are undefined
  const missing = [];
  if (!process.env.REACT_APP_BACKEND_URL) missing.push('REACT_APP_BACKEND_URL');
  if (!process.env.REACT_APP_API_BASE_URL) missing.push('REACT_APP_API_BASE_URL');
  if (!process.env.REACT_APP_WS_URL) missing.push('REACT_APP_WS_URL');

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    console.error('💡 Did you restart the dev server after editing .env?');
  } else {
    console.log('✅ All required environment variables loaded');
  }

  console.groupEnd();
};

// Export for easy debugging
export const ENV = {
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000',
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || '/api/v1',
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8001/ws',
  FEATURE_LEARNING_GATES: process.env.REACT_APP_FEATURE_LEARNING_GATES === 'true',
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),
};
