import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './auth';
import { useAuthStore } from '@/stores/auth.store';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

// Stub 401 refresh interceptor — real refresh flow will be wired when the
// auth module is implemented (Phase 2, §4.1).
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      refreshPromise ??= (async () => {
        const refresh = tokenStorage.getRefresh();
        if (!refresh) {
          useAuthStore.getState().clear();
          return null;
        }
        try {
          const { data } = await axios.post<{
            accessToken: string;
            refreshToken: string;
          }>(`${baseURL}/auth/refresh`, { refreshToken: refresh });
          tokenStorage.set(data.accessToken, data.refreshToken);
          return data.accessToken;
        } catch {
          // Refresh failed: wipe token storage AND the Zustand auth state so
          // ProtectedRoute re-renders and redirects to /login cleanly.
          useAuthStore.getState().clear();
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api.request(original);
      }
    }
    return Promise.reject(error);
  },
);
