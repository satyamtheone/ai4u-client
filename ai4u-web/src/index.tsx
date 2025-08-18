import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';

// V1 App Component (with V2 auth integration)
import App from './components/App';

// V2 Authentication Provider
import { AuthProvider } from './components/auth/AuthProvider';

import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      // cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Error boundary for better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI4U App Error:', error, errorInfo);
    
    // You can also log to your error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="main-content">
            <div className="welcome-state">
              <div className="welcome-icon" style={{ fontSize: '48px' }}>⚠️</div>
              <h2 className="welcome-title">Oops! Something went wrong</h2>
              <p className="welcome-subtitle">
                AI4U encountered an unexpected error. Please refresh the page to try again.
              </p>
              
              <div className="topic-pills">
                <button
                  className="topic-pill"
                  onClick={() => window.location.reload()}
                  style={{ background: '#2563eb', color: 'white' }}
                >
                  🔄 Refresh Page
                </button>
                <button
                  className="topic-pill"
                  onClick={() => window.location.href = '/'}
                  style={{ background: '#10b981', color: 'white' }}
                >
                  🏠 Go to Home
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details style={{ 
                  marginTop: '24px', 
                  textAlign: 'left',
                  background: '#2a2a2a',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  padding: '16px',
                  maxWidth: '600px'
                }}>
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    color: '#b3b3b3',
                    marginBottom: '8px'
                  }}>
                    Technical Details (Development Only)
                  </summary>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#ef4444',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>Error:</div>
                    <div style={{ marginBottom: '12px' }}>{this.state.error?.message}</div>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>Stack Trace:</div>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap',
                      fontSize: '11px',
                      lineHeight: '1.4'
                    }}>{this.state.error?.stack}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <App />
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);