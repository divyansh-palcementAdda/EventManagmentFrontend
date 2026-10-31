// API Endpoints Configuration
const API_ROUTES = {
  // Authentication Endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh',
    ME: '/auth/me',
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
  },

  // Check-in Management Endpoints
  CHECKIN: {
    SCAN: '/checkin',
  },
};

export default API_ROUTES;
