import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Prioritize user-scoped private key to prevent cross-account key collision
    const userStr = localStorage.getItem('user');
    let privateKey: string | null = null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u?.email) {
          privateKey = localStorage.getItem(`ecc_private_key_${u.email}`);
        }
      } catch {}
    }
    if (!privateKey) {
      privateKey = localStorage.getItem('ecc_private_key');
    }
    if (privateKey) {
      let cleaned = privateKey.trim();
      if (cleaned.includes('-----BEGIN')) {
        cleaned = cleaned
          .replace(/-----BEGIN[\s\S]*?-----/g, '')
          .replace(/-----END[\s\S]*?-----/g, '')
          .replace(/["']/g, '')
          .replace(/\s+/g, '');
      }
      config.headers['X-Private-Key'] = cleaned;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if checking /api/auth/me or logging in
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/verify-login-otp') && !url.includes('/auth/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
