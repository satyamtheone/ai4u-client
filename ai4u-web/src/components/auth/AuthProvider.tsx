import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { StorageService } from "../../services/utils/StorageService";
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthState,
  UserType,
} from "../../types/auth/Auth";

import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLazyGetCurrentUserQuery,
  useLazyGetMyOrganizationsQuery,
} from "../../services/api/authApi";

interface AuthContextType extends AuthState {
  userLogin: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // RTK Query hooks
  const [login] = useLoginMutation();
  const [registerMut] = useRegisterMutation();
  const [logoutMut] = useLogoutMutation();
  const [fetchMe] = useLazyGetCurrentUserQuery();
  const [fetchMyOrgs] = useLazyGetMyOrganizationsQuery();

  const storageService = new StorageService();

  const [state, setState] = useState<AuthState>({
    user: undefined,
    access_token: undefined,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    organization: undefined,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = storageService.getToken();
      if (token) {
        await refreshUser();
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      await logout();
    }
  };

  const userLogin = async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const resp = await login(credentials).unwrap();

      const token = resp?.access_token ?? resp?.access_token ?? null;

      if (token) {
        storageService.setToken(token);
      }

      const user = await fetchMe().unwrap();
      const orgRes = await fetchMyOrgs().unwrap();
      const organization = orgRes?.[0] ?? null;

      setState({
        user,
        access_token: token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        organization,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.data?.message || error?.message || "Login failed",
      }));
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const resp = await registerMut(userData).unwrap();
      const token = resp?.access_token ?? resp?.access_token ?? null;

      if (token) {
        storageService.setToken(token);
      }

      const user = resp?.user ?? (await fetchMe().unwrap());

      const orgRes = await fetchMyOrgs().unwrap();
      const organization = orgRes?.[0] ?? null;

      setState({
        user,
        access_token: token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        organization,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.data?.message || error?.message || "Registration failed",
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMut()
        .unwrap()
        .catch(() => undefined);
    } finally {
      storageService.clearTokens();
      setState({
        user: undefined,
        access_token: undefined,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        organization: undefined,
      });
    }
  };

  const refreshUser = async () => {
    try {
      const user = await fetchMe().unwrap();
      const orgRes = await fetchMyOrgs().unwrap();
      const organization = orgRes?.[0] ?? null;

      setState((prev) => ({
        ...prev,
        user,
        organization,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      await logout();
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    userLogin,
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
