// @ts-nocheck
import axios from 'axios';
import { msalInstance } from './msalConfig'; // your MSAL instance
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { navigateToLoginAfterUnauthorized } from './navigationService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// ─── Token Scopes ─────────────────────────────────────────────────────────────
const TOKEN_SCOPES = {
  scopes: [`api://${import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`]
};

// ─── Get Fresh Token (Silent → Popup fallback) ────────────────────────────────
async function getFreshToken(): Promise<string | null> {
  const account = msalInstance.getActiveAccount();
  if (!account) return null;

  try {
    // Always try silent first — MSAL auto-refreshes if near expiry
    const result = await msalInstance.acquireTokenSilent({
      ...TOKEN_SCOPES,
      account,
    });
    // Keep localStorage in sync for any legacy code that reads it
    localStorage.setItem('qhrms_token', result.accessToken);
    return result.accessToken;

  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Refresh token also expired → need user interaction
      try {
        const result = await msalInstance.acquireTokenPopup({
          ...TOKEN_SCOPES,
          account,
        });
        localStorage.setItem('qhrms_token', result.accessToken);
        return result.accessToken;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    //  Always get a fresh/valid token before every request
    const token = await getFreshToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Fallback: use stored token (handles non-MSAL auth flows)
      const stored = localStorage.getItem('qhrms_token');
      if (stored) config.headers.Authorization = `Bearer ${stored}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Track if we already retried to avoid infinite loops
let isRetrying = false;

api.interceptors.response.use(
  (response) => {
    const rt = response?.config?.responseType;
    if (rt === 'blob' || rt === 'arraybuffer') return response;
    return response.data;
  },
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status === 401 && !isRetrying && !originalRequest._retry) {
      // ✅ On 401: retry ONCE with a fresh token instead of immediately logging out
      originalRequest._retry = true;
      isRetrying = true;

      try {
        const freshToken = await getFreshToken();
        if (freshToken) {
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          isRetrying = false;
          return api(originalRequest); // Retry the original request
        }
      } catch {
        // Token refresh failed completely
      }

      isRetrying = false;
      // Only navigate to login if retry also failed
      navigateToLoginAfterUnauthorized();
    }

    if (status === 403) {
      console.error('Access denied: insufficient permissions');
    }

    if (status === 500) {
      console.error('Server error:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;