import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Authentication Components
import { useAuth } from './auth/AuthProvider';
import { AuthMain } from './auth/AuthMain';
import { AuthGuard } from './auth/AuthGuard';
import { GoogleAuthButton } from './auth/GoogleAuthButton';

// Dashboard Components
import { DashboardLayout } from './dashboard/DashboardLayout';

// Your Existing Components (keep these imports as they were)
import EnhancedChatInterface  from '../components/EnhancedChatInterface';
import ConfigPanel from './ConfigPanel';
import  NotificationContainer from './NotificationContainer';
// Add any other existing component imports you had

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthGuard
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      {children}
    </AuthGuard>
  );
};

// Loading Component
const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Initializing AI4U..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">AI4U</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Error Pages Components
const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md p-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p className="text-gray-600 mb-6">
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <div className="space-y-3">
        <button 
          onClick={() => window.history.back()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  </div>
);

const EmailVerificationPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md p-6">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Verify Your Email</h1>
      <p className="text-gray-600 mb-6">
        Please check your email and click the verification link to continue using AI4U.
      </p>
      <div className="space-y-3">
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Continue to Dashboard
        </button>
        <button 
          onClick={() => {/* Add resend email logic */}}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  </div>
);

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md p-6">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.2-5.45-2.83" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="space-y-3">
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
        <button 
          onClick={() => window.history.back()}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

// Main App Component
const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Authentication Routes - Only show if not authenticated */}
        <Route 
          path="/auth" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthMain defaultView="login" redirectTo="/dashboard" />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthMain defaultView="login" redirectTo="/dashboard" />
            )
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthMain defaultView="individual-signup" redirectTo="/dashboard" />
            )
          } 
        />
        <Route 
          path="/signup/organization" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthMain defaultView="organization-signup" redirectTo="/dashboard" />
            )
          } 
        />

        {/* Google OAuth Callback */}
        <Route path="/auth/google/callback" element={<GoogleAuthButton />} />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } 
        />

        {/* Legacy Routes - Keep your existing functionality */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-100">
                <EnhancedChatInterface />
              </div>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/learning" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-100">
                {/* You can integrate your existing learning interface here */}
                <EnhancedChatInterface />
              </div>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/config" 
          element={
            <ProtectedRoute>
              <ConfigPanel />
            </ProtectedRoute>
          } 
        />

        {/* Error and Special Pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />

        {/* Default Redirect - Smart routing based on auth status */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={isAuthenticated ? "/dashboard" : "/auth"} 
              replace 
            />
          } 
        />

        {/* 404 Page - Must be last */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Components - Keep your existing notification system */}
      <NotificationContainer />
    </div>
  );
};

export default App;