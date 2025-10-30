import { BaseApiService } from "./BaseApiService";
import { API_ENDPOINTS } from "../../utils/constants/apiEndpoints";

// Organization Types
export interface Organization {
  id: number;
  name: string;
  description: string;
  industry: string;
  company_size?: string;
  website?: string;
  logo_url?: string;
  subscription_plan: "basic" | "pro" | "enterprise";
  subscription_status: "active" | "suspended" | "trial";
  adminId: number;
  created_at: string;
  updatedAt: string;
  slug: string;
  current_user_count: number;
  max_users: number;
  is_active: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  settings?: {
    allowPublicSignup: boolean;
    requireEmailVerification: boolean;
    enableSso: boolean;
    defaultUserRole: "user" | "admin";
  };
}

export interface OrganizationResponse {
  message: string;
  data: Organization[];
}

export interface OrganizationMember {
  id: number;
  userId: number;
  organizationId: number;
  role: "admin" | "user";
  status: "active" | "pending" | "suspended";
  joinedAt: string;
  invitedBy?: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    lastActive?: string;
  };
  progress: {
    coursesCompleted: number;
    totalProgress: number;
    currentStreak: number;
    totalHours: number;
  };
}

export interface OrganizationInvite {
  id: number;
  organizationId: number;
  email: string;
  role: "admin" | "user";
  status: "pending" | "accepted" | "expired" | "cancelled";
  invitedBy: number;
  createdAt: string;
  expiresAt: string;
  message?: string;
  token: string;
}

export interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  averageProgress: number;
  coursesCompleted: number;
  totalHours: number;
  monthlyGrowth: number;
  completionRate: number;
}

export interface OrganizationUsage {
  currentMembers: number;
  maxMembers: number;
  storageUsed: number;
  maxStorage: number;
  apiCallsThisMonth: number;
  maxApiCalls: number;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
}

// Request/Response Types
export interface CreateOrganizationRequest {
  name: string;
  description: string;
  industry: string;
  company_size: string;
  website?: string;
  slug: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  logo?: string;
  settings?: Partial<Organization["settings"]>;
  address?: Partial<Organization["address"]>;
}

export interface InviteMemberRequest {
  email: string;
  role: "admin" | "user";
  message?: string;
}

export interface UpdateMemberRequest {
  role?: "admin" | "user";
  status?: "active" | "suspended";
}

export interface BulkInviteRequest {
  invites: Array<{
    email: string;
    role: "admin" | "user";
    message?: string;
  }>;
}
// User list types
export interface UserItem {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  auth_method: string;
  account_type: "INDIVIDUAL" | "ORGANIZATION" | string;
  accept_terms: boolean;
  subscribe_newsletter: boolean;
  timezone: string;
  locale: string;
  id: string;
  full_name: string;
  avatar_url: string;
  is_active: boolean;
  is_email_verified: boolean;
  login_count: number;
  last_login_at: string;
  created_at: string;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: {
    items: UserItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}
// === Organization Member Creation ===

export interface CreateMemberRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: "org_member" | "admin" | string;
  send_invitation_email: boolean;
  timezone: string;
  locale: string;
}

export interface CreateMemberResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    timezone: string;
    locale: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  data: Organization;
}

export class OrganizationService extends BaseApiService {
  constructor(baseURL?: string, token?: string | null) {
    super();
    // Optional: override base URL if you want to point this service
    // to a different host than apiConfig.baseURL
    if (baseURL) {
      // baseURL is protected in BaseApiService, so we can set it
      (this as any).baseURL = baseURL;
    }
    if (token) {
      this.setToken(token);
    }
  }

  // Organization CRUD Operations
  async createOrganization(
    data: CreateOrganizationRequest
  ): Promise<Organization> {
    try {
      return await this.post<Organization>(
        API_ENDPOINTS.ORGANIZATIONS.CREATE,
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to create organization"
      );
    }
  }

  async getOrganization(id: number): Promise<Organization> {
    try {
      return await this.get<Organization>(
        API_ENDPOINTS.ORGANIZATIONS.BY_ID(id)
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch organization"
      );
    }
  }

  async getMyOrganizations(): Promise<OrganizationResponse> {
    try {
      return await this.get<OrganizationResponse>(
        API_ENDPOINTS.ORGANIZATIONS.MY
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch organizations"
      );
    }
  }

  async getAllMembers(
    page: number = 1,
    pageSize: number = 50
  ): Promise<UserListResponse> {
    try {
      const query = `?page=${page}&page_size=${pageSize}`;
      return await this.get<UserListResponse>(
        `${API_ENDPOINTS.USERS.LIST}${query}`
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch users"
      );
    }
  }
  /**
   * Create a new organization member
   * Endpoint: POST /api/v1/users/members
   */
  async createOrganizationMember(
    payload: CreateMemberRequest
  ): Promise<CreateMemberResponse> {
    try {
      return await this.post<CreateMemberResponse>(
        API_ENDPOINTS.USERS.ADD_MEMBER,
        payload
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create organization member"
      );
    }
  }

  async updateOrganization(
    id: number,
    data: UpdateOrganizationRequest
  ): Promise<Organization> {
    try {
      return await this.put<Organization>(
        API_ENDPOINTS.ORGANIZATIONS.UPDATE(id),
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update organization"
      );
    }
  }

  async deleteOrganization(id: number): Promise<void> {
    try {
      await this.delete(API_ENDPOINTS.ORGANIZATIONS.DELETE(id));
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete organization"
      );
    }
  }

  // Member Management
  async getMembers(
    orgId: number,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: "admin" | "user";
      status?: "active" | "pending" | "suspended";
    }
  ): Promise<{
    members: OrganizationMember[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = params
        ? new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
              if (value !== undefined) acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
          ).toString()
        : "";

      const url = queryParams
        ? `${API_ENDPOINTS.ORGANIZATIONS.MEMBERS(orgId)}?${queryParams}`
        : API_ENDPOINTS.ORGANIZATIONS.MEMBERS(orgId);

      return await this.get(url);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch members"
      );
    }
  }

  async inviteMember(
    orgId: number,
    data: InviteMemberRequest
  ): Promise<OrganizationInvite> {
    try {
      return await this.post<OrganizationInvite>(
        API_ENDPOINTS.ORGANIZATIONS.INVITE(orgId),
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    }
  }

  async bulkInviteMembers(
    orgId: number,
    data: BulkInviteRequest
  ): Promise<{
    successful: OrganizationInvite[];
    failed: Array<{ email: string; error: string }>;
  }> {
    try {
      return await this.post(
        `${API_ENDPOINTS.ORGANIZATIONS.INVITE(orgId)}/bulk`,
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to send bulk invitations"
      );
    }
  }

  async updateMember(
    orgId: number,
    memberId: number,
    data: UpdateMemberRequest
  ): Promise<OrganizationMember> {
    try {
      return await this.put<OrganizationMember>(
        API_ENDPOINTS.ORGANIZATIONS.UPDATE_MEMBER_ROLE(orgId, memberId),
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update member"
      );
    }
  }

  async removeMember(orgId: number, memberId: number): Promise<void> {
    try {
      await this.delete(
        API_ENDPOINTS.ORGANIZATIONS.REMOVE_MEMBER(orgId, memberId)
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    }
  }

  async resendInvite(orgId: number, inviteId: number): Promise<void> {
    try {
      await this.post(
        `${API_ENDPOINTS.ORGANIZATIONS.INVITE(orgId)}/${inviteId}/resend`
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to resend invitation"
      );
    }
  }

  async cancelInvite(orgId: number, inviteId: number): Promise<void> {
    try {
      await this.delete(
        `${API_ENDPOINTS.ORGANIZATIONS.INVITE(orgId)}/${inviteId}`
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to cancel invitation"
      );
    }
  }

  // Statistics and Analytics
  async getOrganizationStats(orgId: number): Promise<OrganizationStats> {
    try {
      return await this.get<OrganizationStats>(
        `${API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId)}/stats`
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch organization statistics"
      );
    }
  }

  async getOrganizationUsage(orgId: number): Promise<OrganizationUsage> {
    try {
      return await this.get<OrganizationUsage>(
        API_ENDPOINTS.ORGANIZATIONS.USAGE(orgId)
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch organization usage"
      );
    }
  }

  async getOrganizationAnalytics(
    orgId: number,
    params?: {
      startDate?: string;
      endDate?: string;
      metric?: "progress" | "engagement" | "completion";
    }
  ): Promise<any> {
    try {
      const queryParams = params
        ? new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
              if (value !== undefined) acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
          ).toString()
        : "";

      const url = queryParams
        ? `${API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId)}/analytics?${queryParams}`
        : `${API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId)}/analytics`;

      return await this.get(url);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch organization analytics"
      );
    }
  }

  // Settings Management
  async updateSettings(
    orgId: number,
    settings: Partial<Organization["settings"]>
  ): Promise<Organization> {
    try {
      return await this.put<Organization>(
        API_ENDPOINTS.ORGANIZATIONS.SETTINGS(orgId),
        { settings }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update organization settings"
      );
    }
  }

  // Billing Operations
  async getBillingInfo(orgId: number): Promise<any> {
    try {
      return await this.get(API_ENDPOINTS.ORGANIZATIONS.BILLING(orgId));
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch billing information"
      );
    }
  }

  async updateBillingInfo(orgId: number, billingData: any): Promise<any> {
    try {
      return await this.put(
        API_ENDPOINTS.ORGANIZATIONS.BILLING(orgId),
        billingData
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update billing information"
      );
    }
  }

  // File Upload
  async uploadLogo(orgId: number, file: File): Promise<{ logoUrl: string }> {
    try {
      return await this.uploadFile(
        `${API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId)}/logo`,
        file
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to upload logo"
      );
    }
  }

  // Organization Search and Discovery
  async searchOrganizations(
    query: string,
    filters?: {
      industry?: string;
      size?: string;
      location?: string;
    }
  ): Promise<Organization[]> {
    try {
      const params = new URLSearchParams({ query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      return await this.get<Organization[]>(
        `${API_ENDPOINTS.ORGANIZATIONS.LIST}?${params.toString()}`
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to search organizations"
      );
    }
  }

  // Join Organization (for public signup)
  async joinOrganization(
    orgId: number,
    inviteToken?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.post(
        `${API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId)}/join`,
        { inviteToken }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to join organization"
      );
    }
  }

  // Leave Organization
  async leaveOrganization(orgId: number): Promise<void> {
    try {
      await this.post(`${API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId)}/leave`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to leave organization"
      );
    }
  }

  // Export Data
  async exportMemberData(
    orgId: number,
    format: "csv" | "json" | "xlsx" = "csv"
  ): Promise<Blob> {
    try {
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.ORGANIZATIONS.BY_ID(
          orgId
        )}/export?format=${format}`,
        {
          headers: {
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      return await response.blob();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to export data"
      );
    }
  }

  // Audit Logs
  async getAuditLogs(
    orgId: number,
    params?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      action?: string;
      userId?: number;
    }
  ): Promise<any> {
    try {
      const queryParams = params
        ? new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
              if (value !== undefined) acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
          ).toString()
        : "";

      const url = queryParams
        ? `${API_ENDPOINTS.ORGANIZATIONS.BY_ID(
            orgId
          )}/audit-logs?${queryParams}`
        : `${API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId)}/audit-logs`;

      return await this.get(url);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch audit logs"
      );
    }
  }
}
