import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { ServiceFactory } from "../../services/ServiceFactory";
import { tokenManager } from "../../services/auth/TokenManager";
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthState,
  UserType,
} from "../../types/auth/Auth";

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
    access_token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    organization: undefined,
  });

  // Use singleton service instances
  const authService = ServiceFactory.getAuthService();

  useEffect(() => {
    initializeAuth();
    console.log("AuthProvider mounted and initialized");

    // Set up event listeners for auth events
    const handleUnauthorized = () => {
      console.log("Auth: Unauthorized - logging out");
      logout();
    };

    const handleForbidden = (event: CustomEvent) => {
      console.error("Auth: Forbidden access", event.detail);
      setState(prev => ({
        ...prev,
        error: "Access forbidden"
      }));
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized as EventListener);
    window.addEventListener("auth:forbidden", handleForbidden as EventListener);

    // Cleanup listeners
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized as EventListener);
      window.removeEventListener("auth:forbidden", handleForbidden as EventListener);
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // Get token from TokenManager (centralized)
      const token = tokenManager.getToken();
      if (token) {
        // Token exists, validate and refresh user
        const validToken = await tokenManager.getValidToken();
        if (validToken) {
          await refreshUser();
        } else {
          // Token expired and couldn't be refreshed
          logout();
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      logout();
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      console.log("credentials", credentials);

      const response = await authService.login(credentials);
      const access_token = response.access_token;
      const refresh_token = response.refreshToken;

      // Store tokens using TokenManager (centralized)
      tokenManager.setTokens(access_token, refresh_token);

      const user = await authService.getCurrentUser();
      const orgRes = await authService.getMyOrganizations();

      const organization = orgRes?.data?.[0];

      setState({
        user,
        access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        organization,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Login failed",
      }));
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.register(userData);
      const { access_token, refreshToken, user } = response;

      // Store tokens using TokenManager (centralized)
      tokenManager.setTokens(access_token, refreshToken);

      setState({
        user,
        access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Registration failed",
      }));
      throw error;
    }
  };

  const logout = () => {
    // Clear tokens using TokenManager (centralized)
    tokenManager.clearTokens();

    // Call server logout if needed
    authService.logout().catch(err => {
      console.error("Server logout failed:", err);
    });

    setState({
      user: null,
      access_token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const refreshUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      const orgRes = await authService.getMyOrganizations();
      const organization = orgRes?.data?.[0];
      setState((prev) => ({
        ...prev,
        user,
        organization,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to refresh user:", error);
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
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Single centralized permissions hook - no duplication
export const usePermissions = () => {
  const { user, organization } = useAuth();

  const hasRole = (role: UserType): boolean => {
    return user?.userType === role;
  };
  const hasOrgName = (): boolean => {
    return Boolean(organization?.name);
  };

  const hasAnyRole = (roles: UserType[]): boolean => {
    return user ? roles.includes(user.userType) : false;
  };

  const canManageOrganization = (): boolean => {
    return user?.userType === "organization_admin";
  };

  const canManageTeam = (): boolean => {
    return (
      user?.userType === "organization_admin" ||
      user?.organization?.role === "admin"
    );
  };

  const isInOrganization = (): boolean => {
    return Boolean(user?.organization);
  };

  const isEmailVerified = (): boolean => {
    return Boolean(user?.emailVerified);
  };

  const isIndividualUser = (): boolean => {
    return user?.userType === "individual";
  };

  const isOrganizationAdmin = (): boolean => {
    return user?.userType === "organization_admin";
  };

  const isOrganizationUser = (): boolean => {
    return user?.userType === "organization_user";
  };

  const canInviteUsers = (): boolean => {
    return canManageTeam();
  };

  const canViewAnalytics = (): boolean => {
    return (
      user?.userType === "organization_admin" ||
      user?.userType === "organization_user"
    );
  };

  const canManageBilling = (): boolean => {
    return user?.userType === "organization_admin";
  };

  return {
    user,
    organization,
    hasOrgName,
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
