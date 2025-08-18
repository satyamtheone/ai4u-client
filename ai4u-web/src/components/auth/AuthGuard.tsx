import React, { ReactElement, isValidElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from './AuthProvider';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { UserType } from '../../types/auth/Auth';

export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
  requireEmailVerification?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireOrganization?: boolean;
}

export const AuthGuard = ({
  children,
  allowedRoles,
  requireEmailVerification = false,
  fallback,
  redirectTo = '/login',
  requireOrganization = false,
}: AuthGuardProps): ReactElement | null => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isInOrganization, isEmailVerified } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    // ensure fallback is a valid ReactElement, otherwise use default loader
    if (fallback && isValidElement(fallback)) {
      return fallback;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Verifying authentication..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requireEmailVerification && !isEmailVerified()) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireOrganization) {
    if (user.userType === 'individual') {
      return <Navigate to="/join-organization" replace />;
    }
    if (!isInOrganization()) {
      return <Navigate to="/setup-organization" replace />;
    }
  }

  return <>{children}</>;
};

// HOC wrapper with proper typing
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<AuthGuardProps, 'children'>
): React.FC<P> => {
  return function WithAuthGuard(props: P) {
    return (
      <AuthGuard {...guardProps}>
        <Component {...props} />
      </AuthGuard>
    );
  };
};