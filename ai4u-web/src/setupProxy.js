const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Check if proxy should be enabled via environment variable
  const useProxy = process.env.REACT_APP_USE_PROXY === 'true';
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

  if (useProxy) {
    console.log('🔀 Proxy enabled - Bypassing CORS');
    console.log('🔗 Proxying /api to:', backendUrl);

    // Proxy API requests to backend
    app.use(
      '/api',
      createProxyMiddleware({
        target: backendUrl,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
          console.log(`→ Proxying: ${req.method} ${req.path} to ${backendUrl}`);
        },
        onError: (err, req, res) => {
          console.error('❌ Proxy error:', err.message);
          res.status(500).json({ error: 'Proxy error', message: err.message });
        }
      })
    );
  } else {
    console.log('🚫 Proxy disabled - Making direct requests to backend');
  }
};
