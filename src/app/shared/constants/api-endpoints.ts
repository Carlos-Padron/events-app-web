export const API_ENDPOINTS = {
  auth: {
    login:    '/auth/login',
    register: '/auth/register',
    refresh:  '/auth/refresh',
  },
  events: {
    create: '/events',
  },
} as const;

// Endpoints that should never trigger the 401 refresh & retry flow.
// A 401 on these means the credentials themselves are wrong — not an expired session.
export const SKIP_AUTH_RETRY_ENDPOINTS = [
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.register,
  API_ENDPOINTS.auth.refresh,
] as const;
