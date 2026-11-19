import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const TOKEN_KEY = 'mpm_auth_token';

// Store reference injected at app startup to avoid circular imports
type AppStore = {
  dispatch: (action: { type: string }) => unknown;
};

let storeRef: AppStore | null = null;

export const injectStore = (store: AppStore) => {
  storeRef = store;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT from localStorage to Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle expired/invalid tokens (401) globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // Avoid triggering logout loop if the 401 came from the login/signup endpoint itself
    const isAuthAttempt =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/signup');

    if (status === 401 && !isAuthAttempt && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);

      // Dispatch logout action to clear Redux state
      if (storeRef) {
        storeRef.dispatch({ type: 'auth/logout' });
      }

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Normalize error message so Redux thunks can read error.message cleanly
    const normalizedMessage =
      error.response?.data?.message || error.message || 'Something went wrong';

    return Promise.reject(new Error(normalizedMessage));
  }
);

export default api;