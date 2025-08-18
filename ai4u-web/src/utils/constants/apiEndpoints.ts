export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
  },

  // User endpoints
  USERS: {
    ME: '/users/me',
    LIST: '/users/',
    UPDATE_PROFILE: '/users/me',
    DELETE_ACCOUNT: '/users/me',
    UPLOAD_AVATAR: '/users/me/avatar',
    SESSIONS: '/users/me/sessions',
    TWO_FACTOR: '/users/me/two-factor',
  },

  // Organization endpoints
  ORGANIZATIONS: {
    CREATE: '/organizations/',
    LIST: '/organizations/',
    MY: '/organizations/my',
    BY_ID: (id: number) => `/organizations/${id}`,
    UPDATE: (id: number) => `/organizations/${id}`,
    DELETE: (id: number) => `/organizations/${id}`,
    MEMBERS: (id: number) => `/organizations/${id}/members`,
    INVITE: (id: number) => `/organizations/${id}/invite`,
    REMOVE_MEMBER: (id: number, memberId: number) => 
      `/organizations/${id}/members/${memberId}`,
    UPDATE_MEMBER_ROLE: (id: number, memberId: number) => 
      `/organizations/${id}/members/${memberId}/role`,
    SETTINGS: (id: number) => `/organizations/${id}/settings`,
    BILLING: (id: number) => `/organizations/${id}/billing`,
    USAGE: (id: number) => `/organizations/${id}/usage`,
  },

  // Learning platform endpoints
  LEARNING: {
    CHAT: '/learning/chat',
    QUIZ: {
      SUBMIT: '/learning/quiz/submit',
      SUBMIT_BATCH: '/learning/quiz/submit-batch',
      SKIP: '/learning/quiz/skip',
      QUESTIONS: '/learning/questions',
      RESULTS: '/learning/results',
    },
    PROGRESS: {
      GET: '/learning/progress',
      RESET: '/learning/progress/reset',
      UPDATE: '/learning/progress/update',
    },
    STATS: '/learning/stats',
    ADMIN: {
      QUESTIONS: '/learning/admin/questions',
      CREATE_QUESTION: '/learning/admin/questions',
      UPDATE_QUESTION: (id: number) => `/learning/admin/questions/${id}`,
      DELETE_QUESTION: (id: number) => `/learning/admin/questions/${id}`,
      BULK_IMPORT: '/learning/admin/questions/bulk-import',
    },
  },

  // File upload endpoints
  UPLOADS: {
    AVATAR: '/uploads/avatar',
    DOCUMENTS: '/uploads/documents',
    BULK: '/uploads/bulk',
  },

  // Notification endpoints
  NOTIFICATIONS: {
    LIST: '/notifications/',
    MARK_READ: (id: number) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
    PREFERENCES: '/notifications/preferences',
    SUBSCRIBE_PUSH: '/notifications/push/subscribe',
    UNSUBSCRIBE_PUSH: '/notifications/push/unsubscribe',
  },

  // Admin endpoints
  ADMIN: {
    USERS: {
      LIST: '/admin/users',
      BY_ID: (id: number) => `/admin/users/${id}`,
      UPDATE: (id: number) => `/admin/users/${id}`,
      DELETE: (id: number) => `/admin/users/${id}`,
      SUSPEND: (id: number) => `/admin/users/${id}/suspend`,
      UNSUSPEND: (id: number) => `/admin/users/${id}/unsuspend`,
      IMPERSONATE: (id: number) => `/admin/users/${id}/impersonate`,
    },
    ORGANIZATIONS: {
      LIST: '/admin/organizations',
      BY_ID: (id: number) => `/admin/organizations/${id}`,
      UPDATE: (id: number) => `/admin/organizations/${id}`,
      DELETE: (id: number) => `/admin/organizations/${id}`,
      SUSPEND: (id: number) => `/admin/organizations/${id}/suspend`,
      UNSUSPEND: (id: number) => `/admin/organizations/${id}/unsuspend`,
    },
    ANALYTICS: {
      OVERVIEW: '/admin/analytics/overview',
      USERS: '/admin/analytics/users',
      ORGANIZATIONS: '/admin/analytics/organizations',
      LEARNING: '/admin/analytics/learning',
      REVENUE: '/admin/analytics/revenue',
    },
    SYSTEM: {
      HEALTH: '/admin/system/health',
      LOGS: '/admin/system/logs',
      SETTINGS: '/admin/system/settings',
      MAINTENANCE: '/admin/system/maintenance',
    },
  },

  // Integration endpoints
  INTEGRATIONS: {
    SLACK: {
      CONNECT: '/integrations/slack/connect',
      DISCONNECT: '/integrations/slack/disconnect',
      CHANNELS: '/integrations/slack/channels',
      SEND_MESSAGE: '/integrations/slack/send-message',
    },
    TEAMS: {
      CONNECT: '/integrations/teams/connect',
      DISCONNECT: '/integrations/teams/disconnect',
      CHANNELS: '/integrations/teams/channels',
    },
    WEBHOOKS: {
      LIST: '/integrations/webhooks',
      CREATE: '/integrations/webhooks',
      UPDATE: (id: number) => `/integrations/webhooks/${id}`,
      DELETE: (id: number) => `/integrations/webhooks/${id}`,
      TEST: (id: number) => `/integrations/webhooks/${id}/test`,
    },
  },

  // Billing endpoints
  BILLING: {
    PLANS: '/billing/plans',
    SUBSCRIPTION: '/billing/subscription',
    PAYMENT_METHODS: '/billing/payment-methods',
    INVOICES: '/billing/invoices',
    USAGE: '/billing/usage',
    UPGRADE: '/billing/upgrade',
    DOWNGRADE: '/billing/downgrade',
    CANCEL: '/billing/cancel',
    REACTIVATE: '/billing/reactivate',
    PORTAL: '/billing/portal',
  },

  // Support endpoints
  SUPPORT: {
    TICKETS: '/support/tickets',
    CREATE_TICKET: '/support/tickets',
    TICKET_BY_ID: (id: number) => `/support/tickets/${id}`,
    ADD_MESSAGE: (id: number) => `/support/tickets/${id}/messages`,
    CLOSE_TICKET: (id: number) => `/support/tickets/${id}/close`,
    FAQ: '/support/faq',
    CONTACT: '/support/contact',
  },
} as const;

// Helper function to build query parameters
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Helper function to build URL with parameters
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  if (!params) return endpoint;
  return `${endpoint}${buildQueryParams(params)}`;
};