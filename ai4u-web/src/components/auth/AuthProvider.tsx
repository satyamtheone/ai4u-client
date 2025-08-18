import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '../../services/api/AuthService';
import { StorageService } from '../../services/utils/StorageService';
import { User, LoginCredentials, RegisterData, AuthState, UserType } from '../../types/auth/Auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const authService = new AuthService();
  const storageService = new StorageService();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = storageService.getToken();
      if (token) {
        authService.setToken(token);
        await refreshUser();
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      logout();
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.login(credentials);
      const { token, user } = response;

      authService.setToken(token);
      storageService.setToken(token);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.register(userData);
      const { token, user } = response;

      authService.setToken(token);
      storageService.setToken(token);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  };

  const logout = () => {
    authService.setToken(null);
    storageService.clearTokens();
    
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const refreshUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Single centralized permissions hook - no duplication
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role: UserType): boolean => {
    return user?.userType === role;
  };

  const hasAnyRole = (roles: UserType[]): boolean => {
    return user ? roles.includes(user.userType) : false;
  };

  const canManageOrganization = (): boolean => {
    return user?.userType === 'organization_admin';
  };

  const canManageTeam = (): boolean => {
    return user?.userType === 'organization_admin' || 
           (user?.organization?.role === 'admin');
  };

  const isInOrganization = (): boolean => {
    return Boolean(user?.organization);
  };

  const isEmailVerified = (): boolean => {
    return Boolean(user?.emailVerified);
  };

  const isIndividualUser = (): boolean => {
    return user?.userType === 'individual';
  };

  const isOrganizationAdmin = (): boolean => {
    return user?.userType === 'organization_admin';
  };

  const isOrganizationUser = (): boolean => {
    return user?.userType === 'organization_user';
  };

  const canInviteUsers = (): boolean => {
    return canManageTeam();
  };

  const canViewAnalytics = (): boolean => {
    return user?.userType === 'organization_admin' || user?.userType === 'organization_user';
  };

  const canManageBilling = (): boolean => {
    return user?.userType === 'organization_admin';
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    canManageOrganization,
    canManageTeam,
    isInOrganization,
    isEmailVerified,
    isIndividualUser,
    isOrganizationAdmin,
    isOrganizationUser,
    canInviteUsers,
    canViewAnalytics,
    canManageBilling,
  };
};