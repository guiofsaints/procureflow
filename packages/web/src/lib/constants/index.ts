/**
 * Application constants for ProcureFlow
 */

export const APP_CONFIG = {
  name: 'ProcureFlow',
  version: '0.1.0',
  description: 'AI-Native Procurement Platform',
  urls: {
    homepage: 'https://procureflow.com',
    docs: 'https://docs.procureflow.com',
    api: '/api',
  },
} as const;

export const API_ROUTES = {
  health: '/api/health',
  auth: {
    signin: '/api/auth/signin',
    signout: '/api/auth/signout',
    session: '/api/auth/session',
  },
} as const;

export const UI_CONSTANTS = {
  pageSize: 10,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
  debounceDelay: 300, // ms
} as const;
