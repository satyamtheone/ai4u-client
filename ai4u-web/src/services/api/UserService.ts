import { BaseApiService } from './BaseApiService';
import { API_ENDPOINTS } from '../../utils/constants/apiEndpoints';

// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  userType: 'individual' | 'organization_admin' | 'organization_user';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  emailVerified: boolean;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  
  // Organization info (if applicable)
  organization?: {
    id: number;
    name: string;
    role: 'admin' | 'user';
    joinedAt: string;
  };
  
  // User preferences
  preferences: UserPreferences;
  
  // Learning statistics
  learningStats: LearningStats;
  
  // Profile completeness
  profileCompletion: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    courseReminders: boolean;
    achievementAlerts: boolean;
    weeklyReports: boolean;
  };
  privacy: {
    showProfile: boolean;
    showProgress: boolean;
    allowDirectMessages: boolean;
  };
  learning: {
    dailyGoal: number; // minutes
    weeklyGoal: number; // minutes
    preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
    autoplay: boolean;
    skipCompleted: boolean;
  };
}

export interface LearningStats {
  totalHours: number;
  coursesCompleted: number;
  coursesInProgress: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
  totalQuizzes: number;
  achievementsEarned: number;
  weeklyGoalProgress: number;
  monthlyProgress: number;
  lastActivity: string;
}

export interface UserSession {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  ipAddress: string;
  location?: string;
  current: boolean;
  createdAt: string;
  lastActivity: string;
}

export interface UserActivity {
  id: number;
  type: 'login' | 'course_start' | 'course_complete' | 'quiz_complete' | 'achievement_earned';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserProgress {
  courseId: number;
  courseName: string;
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  timeSpent: number; // minutes
  lastAccessed: string;
  completedAt?: string;
  quizScore?: number;
  certificateUrl?: string;
}

export interface UserAchievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: 'completion' | 'streak' | 'speed' | 'score' | 'participation';
  earnedAt: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Request/Response Types
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
  avatar?: string;
}

export interface UpdatePreferencesRequest {
  theme?: UserPreferences['theme'];
  language?: string;
  timezone?: string;
  notifications?: Partial<UserPreferences['notifications']>;
  privacy?: Partial<UserPreferences['privacy']>;
  learning?: Partial<UserPreferences['learning']>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserSearchParams {
  query?: string;
  organizationId?: number;
  userType?: User['userType'];
  status?: User['status'];
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UserService extends BaseApiService {
  
  // Profile Management
  async getCurrentUser(): Promise<User> {
    try {
      return await this.get<User>(API_ENDPOINTS.USERS.ME);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user profile'
      );
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      return await this.put<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    }
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      return await this.uploadFile<{ avatarUrl: string }>(
        API_ENDPOINTS.USERS.UPLOAD_AVATAR,
        file
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload avatar'
      );
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      await this.delete(API_ENDPOINTS.USERS.DELETE_ACCOUNT);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete account'
      );
    }
  }

  // User Preferences
  async getPreferences(): Promise<UserPreferences> {
    try {
      const user = await this.getCurrentUser();
      return user.preferences;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch preferences'
      );
    }
  }

  async updatePreferences(data: UpdatePreferencesRequest): Promise<UserPreferences> {
    try {
      const response = await this.put<{ preferences: UserPreferences }>(
        `${API_ENDPOINTS.USERS.ME}/preferences`,
        data
      );
      return response.preferences;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update preferences'
      );
    }
  }

  // Password Management
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      return await this.put<{ message: string }>(
        `${API_ENDPOINTS.USERS.ME}/password`,
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to change password'
      );
    }
  }

  // Session Management
  async getSessions(): Promise<UserSession[]> {
    try {
      return await this.get<UserSession[]>(API_ENDPOINTS.USERS.SESSIONS);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch sessions'
      );
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    try {
      await this.delete(`${API_ENDPOINTS.USERS.SESSIONS}/${sessionId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to terminate session'
      );
    }
  }

  async terminateAllSessions(): Promise<void> {
    try {
      await this.delete(`${API_ENDPOINTS.USERS.SESSIONS}/all`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to terminate all sessions'
      );
    }
  }

  // Activity and Progress
  async getUserActivity(params?: {
    page?: number;
    limit?: number;
    type?: UserActivity['type'];
    startDate?: string;
    endDate?: string;
  }): Promise<{ activities: UserActivity[]; total: number; page: number; limit: number }> {
    try {
      const queryParams = params ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
      const url = queryParams 
        ? `${API_ENDPOINTS.USERS.ME}/activity?${queryParams}`
        : `${API_ENDPOINTS.USERS.ME}/activity`;
        
      return await this.get(url);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user activity'
      );
    }
  }

  async getUserProgress(params?: {
    status?: UserProgress['status'];
    courseId?: number;
  }): Promise<UserProgress[]> {
    try {
      const queryParams = params ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
      const url = queryParams 
        ? `${API_ENDPOINTS.USERS.ME}/progress?${queryParams}`
        : `${API_ENDPOINTS.USERS.ME}/progress`;
        
      return await this.get<UserProgress[]>(url);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user progress'
      );
    }
  }

  async updateProgress(courseId: number, progress: number): Promise<UserProgress> {
    try {
      return await this.put<UserProgress>(
        `${API_ENDPOINTS.USERS.ME}/progress/${courseId}`,
        { progress }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update progress'
      );
    }
  }

  // Achievements
  async getUserAchievements(): Promise<UserAchievement[]> {
    try {
      return await this.get<UserAchievement[]>(`${API_ENDPOINTS.USERS.ME}/achievements`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch achievements'
      );
    }
  }

  // Learning Statistics
  async getLearningStats(): Promise<LearningStats> {
    try {
      const user = await this.getCurrentUser();
      return user.learningStats;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch learning statistics'
      );
    }
  }

  async updateLearningGoals(goals: {
    dailyGoal?: number;
    weeklyGoal?: number;
  }): Promise<UserPreferences> {
    try {
      return await this.updatePreferences({
        learning: goals
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update learning goals'
      );
    }
  }

  // User Management (Admin functions)
  async getUsers(params?: UserSearchParams): Promise<UserListResponse> {
    try {
      const queryParams = params ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
      const url = queryParams 
        ? `${API_ENDPOINTS.USERS.LIST}?${queryParams}`
        : API_ENDPOINTS.USERS.LIST;
        
      return await this.get<UserListResponse>(url);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch users'
      );
    }
  }

  async getUserById(userId: number): Promise<User> {
    try {
      return await this.get<User>(`${API_ENDPOINTS.USERS.LIST}/${userId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user'
      );
    }
  }

  async updateUser(userId: number, data: UpdateProfileRequest): Promise<User> {
    try {
      return await this.put<User>(`${API_ENDPOINTS.USERS.LIST}/${userId}`, data);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update user'
      );
    }
  }

  async suspendUser(userId: number, reason?: string): Promise<void> {
    try {
      await this.post(`${API_ENDPOINTS.USERS.LIST}/${userId}/suspend`, { reason });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to suspend user'
      );
    }
  }

  async unsuspendUser(userId: number): Promise<void> {
    try {
      await this.post(`${API_ENDPOINTS.USERS.LIST}/${userId}/unsuspend`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to unsuspend user'
      );
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      await this.delete(`${API_ENDPOINTS.USERS.LIST}/${userId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete user'
      );
    }
  }

  // Two-Factor Authentication
  async enableTwoFactor(): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    try {
      return await this.post(API_ENDPOINTS.USERS.TWO_FACTOR);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to enable two-factor authentication'
      );
    }
  }

  async verifyTwoFactor(token: string): Promise<{ verified: boolean }> {
    try {
      return await this.post(`${API_ENDPOINTS.USERS.TWO_FACTOR}/verify`, { token });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to verify two-factor authentication'
      );
    }
  }

  async disableTwoFactor(password: string): Promise<void> {
    // try {
    //   await this.delete(API_ENDPOINTS.USERS.TWO_FACTOR, {
    //     body: JSON.stringify({ password })
    //   });
    // } catch (error) {
    //   throw new Error(
    //     error instanceof Error ? error.message : 'Failed to disable two-factor authentication'
    //   );
    // }
  }

  async generateBackupCodes(): Promise<{ backupCodes: string[] }> {
    try {
      return await this.post(`${API_ENDPOINTS.USERS.TWO_FACTOR}/backup-codes`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate backup codes'
      );
    }
  }

  // Email Verification
  async sendVerificationEmail(): Promise<{ message: string }> {
    try {
      return await this.post(`${API_ENDPOINTS.USERS.ME}/send-verification`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to send verification email'
      );
    }
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    try {
      return await this.post(`${API_ENDPOINTS.USERS.ME}/verify-email`, { token });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to verify email'
      );
    }
  }

  // Social Connections
  async getSocialConnections(): Promise<Array<{
    provider: string;
    connected: boolean;
    email?: string;
    connectedAt?: string;
  }>> {
    try {
      return await this.get(`${API_ENDPOINTS.USERS.ME}/social-connections`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch social connections'
      );
    }
  }

  async connectSocialAccount(provider: string, token: string): Promise<{ connected: boolean }> {
    try {
      return await this.post(`${API_ENDPOINTS.USERS.ME}/social-connections/${provider}`, { token });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : `Failed to connect ${provider} account`
      );
    }
  }

  async disconnectSocialAccount(provider: string): Promise<void> {
    try {
      await this.delete(`${API_ENDPOINTS.USERS.ME}/social-connections/${provider}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : `Failed to disconnect ${provider} account`
      );
    }
  }

  // Export User Data (GDPR Compliance)
  async requestDataExport(): Promise<{ requestId: string; estimatedTime: string }> {
    try {
      return await this.post(`${API_ENDPOINTS.USERS.ME}/export-data`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to request data export'
      );
    }
  }

  async getDataExportStatus(requestId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt?: string;
  }> {
    try {
      return await this.get(`${API_ENDPOINTS.USERS.ME}/export-data/${requestId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get export status'
      );
    }
  }

  // User Analytics (for individual users)
  async getUserAnalytics(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    learningTime: Array<{ date: string; minutes: number }>;
    courseProgress: Array<{ courseId: number; courseName: string; progress: number }>;
    streakData: Array<{ date: string; hasActivity: boolean }>;
    skillProgress: Array<{ skill: string; level: number; progress: number }>;
    achievements: Array<{ date: string; achievement: UserAchievement }>;
  }> {
    try {
      return await this.get(`${API_ENDPOINTS.USERS.ME}/analytics?timeframe=${timeframe}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user analytics'
      );
    }
  }

  // Notification Management
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<{
    notifications: Array<{
      id: number;
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      read: boolean;
      createdAt: string;
      actionUrl?: string;
    }>;
    total: number;
    unreadCount: number;
  }> {
    try {
      const queryParams = params ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
      const url = queryParams 
        ? `${API_ENDPOINTS.USERS.ME}/notifications?${queryParams}`
        : `${API_ENDPOINTS.USERS.ME}/notifications`;
        
      return await this.get(url);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch notifications'
      );
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await this.put(`${API_ENDPOINTS.USERS.ME}/notifications/${notificationId}/read`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to mark notification as read'
      );
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await this.put(`${API_ENDPOINTS.USERS.ME}/notifications/mark-all-read`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to mark all notifications as read'
      );
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await this.delete(`${API_ENDPOINTS.USERS.ME}/notifications/${notificationId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete notification'
      );
    }
  }

  // User Search and Discovery
  async searchUsers(query: string, filters?: {
    organizationId?: number;
    skills?: string[];
    location?: string;
    userType?: User['userType'];
  }): Promise<User[]> {
    try {
      const params = new URLSearchParams({ query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }
      
      return await this.get<User[]>(`${API_ENDPOINTS.USERS.LIST}/search?${params.toString()}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to search users'
      );
    }
  }

  // User Connections/Following
  async followUser(userId: number): Promise<void> {
    try {
      await this.post(`${API_ENDPOINTS.USERS.ME}/follow/${userId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to follow user'
      );
    }
  }

  async unfollowUser(userId: number): Promise<void> {
    try {
      await this.delete(`${API_ENDPOINTS.USERS.ME}/follow/${userId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to unfollow user'
      );
    }
  }

  async getFollowing(): Promise<User[]> {
    try {
      return await this.get<User[]>(`${API_ENDPOINTS.USERS.ME}/following`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch following list'
      );
    }
  }

  async getFollowers(): Promise<User[]> {
    try {
      return await this.get<User[]>(`${API_ENDPOINTS.USERS.ME}/followers`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch followers list'
      );
    }
  }

  // User Feedback and Reviews
  async submitFeedback(feedback: {
    type: 'bug' | 'feature' | 'general';
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high';
    attachments?: File[];
  }): Promise<{ ticketId: string }> {
    try {
      if (feedback.attachments && feedback.attachments.length > 0) {
        // Handle file uploads separately
        const formData = new FormData();
        formData.append('type', feedback.type);
        formData.append('title', feedback.title);
        formData.append('description', feedback.description);
        if (feedback.priority) formData.append('priority', feedback.priority);
        
        feedback.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });

        const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USERS.ME}/feedback`, {
          method: 'POST',
          headers: {
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }

        return await response.json();
      } else {
        return await this.post(`${API_ENDPOINTS.USERS.ME}/feedback`, {
          type: feedback.type,
          title: feedback.title,
          description: feedback.description,
          priority: feedback.priority,
        });
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to submit feedback'
      );
    }
  }

  // User Referrals
  async getReferralCode(): Promise<{ code: string; url: string; stats: {
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    rewards: number;
  }}> {
    try {
      return await this.get(`${API_ENDPOINTS.USERS.ME}/referral`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch referral code'
      );
    }
  }

  async getReferralHistory(): Promise<Array<{
    id: number;
    referredUser: string;
    status: 'pending' | 'completed' | 'cancelled';
    reward: number;
    createdAt: string;
    completedAt?: string;
  }>> {
    try {
      return await this.get(`${API_ENDPOINTS.USERS.ME}/referral/history`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch referral history'
      );
    }
  }
}