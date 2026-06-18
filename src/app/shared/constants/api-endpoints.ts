export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
  },
  events: {
    create: '/event',
    mine: '/event/mine',
    coverUploadUrl: (id: string) => `/event/${id}/cover-upload-url`,
    patchCover: (id: string) => `/event/${id}/cover`,
    get: (id: string) => `/event/${id}`,
    joinPreview: (token: string) => `/invitation/${token}/preview`,
    join: (token: string) => `/invitation/${token}/join`,
  },
  captures: {
    list: (eventId: string) => `/event/${eventId}/captures`,
    uploadUrls: (eventId: string) => `/event/${eventId}/captures/upload-urls`,
    confirmBatch: (eventId: string) => `/event/${eventId}/captures/confirm-batch`,
  },
} as const;

// Endpoints that should never trigger the 401 refresh & retry flow.
// A 401 on these means the credentials themselves are wrong — not an expired session.
export const SKIP_AUTH_RETRY_ENDPOINTS = [
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.register,
  API_ENDPOINTS.auth.refresh,
] as const;
