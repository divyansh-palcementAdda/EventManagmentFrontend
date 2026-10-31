// API Endpoints Configuration
const API_ROUTES = {
  // Authentication Endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // User Management Endpoints
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    VIEW: '/users/:id',
    UPDATE: '/users/:id',
    UPDATE_STATUS: '/users/:id/status',
    ROLES: '/users/:id/roles',
    REMOVE_ROLE: '/users/:id/roles/:roleId',
    PASSWORD: '/users/:id/password',
    DELETE: '/users/:id',
  },

  // Role Management Endpoints
  ROLES: {
    LIST: '/roles',
    ALL: '/roles/all',
    CREATE: '/roles',
    VIEW: '/roles/:id',
    UPDATE: '/roles/:id',
    DELETE: '/roles/:id',
    PERMISSIONS: '/roles/:id/permissions',
    REMOVE_PERMISSION: '/roles/:id/permissions/:permissionId',
    USERS: '/roles/:id/users',
  },

  // Permission Management Endpoints
  PERMISSIONS: {
    LIST: '/permissions',
    ALL: '/permissions/all',
    RESOURCES: '/permissions/resources',
    CREATE: '/permissions',
    VIEW: '/permissions/:id',
    UPDATE: '/permissions/:id',
  },

  // Attendee Management Endpoints
  ATTENDEES: {
    LIST: '/attendees',
    CREATE: '/attendees',
    VIEW: '/attendees/:id',
    UPDATE: '/attendees/:id',
    DELETE: '/attendees/:id',
    STATS: '/attendees/stats',
    EXPORT: '/attendees/export',
  },

  // Event Management Endpoints
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    VIEW: '/events/:id',
    UPDATE: '/events/:id',
    UPDATE_STATUS: '/events/:id/status',
    DELETE: '/events/:id',
    DAYS: '/events/:id/days',
    DASHBOARD_STATS: '/events/dashboard-stats',
    GATEKEEPERS: '/events/:id/gatekeepers',
    ASSIGN_GATEKEEPER: '/events/:id/gatekeepers',
    REMOVE_GATEKEEPER: '/events/:id/gatekeepers/:userId',
    ELIGIBLE_GATEKEEPERS: '/events/:id/gatekeepers/eligible',
    CREATE_AND_ASSIGN_GATEKEEPER: '/events/:id/gatekeepers/create-and-assign',
  },

  // Pass Management Endpoints
  PASSES: {
    LIST_BY_EVENT: '/passes/event/:eventId',
    GENERATE: '/passes/generate',
    VALIDATE: '/passes/validate',
    ACTIVATE: '/passes/activate',
    VIEW: '/passes/:id',
    REVOKE: '/passes/:id/revoke',
    STATS: '/passes/event/:eventId/stats',
    EXPORT: '/passes/event/:eventId/export',
    TEMPLATE: '/passes/bulk-activation/template',
    BULK_PREVIEW: '/passes/event/:eventId/bulk-activation/preview',
    BULK_CONFIRM: '/passes/event/:eventId/bulk-activation/confirm',
    VALIDITY: '/passes/event/:eventId/validity',
    SINGLE_VALIDITY: '/passes/:id/validity',
  },

  // Check-in Management Endpoints
  CHECKIN: {
    SCAN: '/checkin',
  },

  // Attendee Management Endpoints
  ATTENDEES: {
    LIST: '/attendees',
    VIEW: '/attendees/:id',
    CREATE: '/attendees',
    UPDATE: '/attendees/:id',
    DELETE: '/attendees/:id',
  },
};

export default API_ROUTES;
