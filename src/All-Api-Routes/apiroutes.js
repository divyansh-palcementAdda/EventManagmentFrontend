// API Endpoints Configuration
const API_ROUTES = {
  // Authentication Endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH_TOKEN: '/auth/refresh-token',
  },

  // User Management Endpoints
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    DISABLE: '/users/:id/disable',
    VIEW: '/users/:id',
  },

  // Role Management Endpoints
  ROLES: {
    LIST: '/roles',
    CREATE: '/roles',
    UPDATE: '/roles/:id',
    DELETE: '/roles/:id',
    VIEW: '/roles/:id',
    ASSIGN: '/roles/:id/assign',
  },

  // Event Management Endpoints
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    UPDATE: '/events/:id',
    DELETE: '/events/:id',
    VIEW: '/events/:id',
    CANCEL: '/events/:id/cancel',
  },

  // Pass Management Endpoints
  PASSES: {
    LIST: '/passes',
    GENERATE: '/passes/generate',
    REVOKE: '/passes/:id/revoke',
    ACTIVATE: '/passes/:id/activate',
    VIEW: '/passes/:id',
  },

  // Check-in Management Endpoints
  CHECKIN: {
    SCAN: '/checkin/scan',
    VIEW: '/checkin/:eventId',
    LOGS: '/checkin/logs',
  },

  // Gatekeeper Management Endpoints
  GATEKEEPERS: {
    LIST: '/gatekeepers',
    ASSIGN: '/gatekeepers/assign',
    REMOVE: '/gatekeepers/:id/remove',
  },

  // Notification Endpoints
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
  },

  // Audit Log Endpoints
  AUDIT_LOGS: {
    LIST: '/audit-logs',
    VIEW: '/audit-logs/:id',
  },

  // Reports Endpoints
  REPORTS: {
    VIEW: '/reports',
    EVENT_REPORT: '/reports/event/:id',
    ATTENDEE_REPORT: '/reports/attendee/:id',
  },
};

export default API_ROUTES;
