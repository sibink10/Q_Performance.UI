// @ts-nocheck
// src/services/api.js
// Centralized Axios instance with:
//   - Base URL configuration
//   - JWT auto-attachment via request interceptor
//   - Global error handling via response interceptor

import axios from 'axios';
import { navigateToLoginAfterUnauthorized } from './navigationService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Automatically attach JWT token to every outgoing request

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qhrms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handle common error scenarios globally

api.interceptors.response.use(
  (response) => {
    // Keep full response for file downloads (need headers like Content-Disposition).
    const rt = response?.config?.responseType;
    if (rt === 'blob' || rt === 'arraybuffer') return response;
    return response.data; // Unwrap data by default
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — clear session and go to login (SPA; avoids full reload)
      navigateToLoginAfterUnauthorized();
    }

    if (status === 403) {
      // Forbidden — user doesn't have required role
      console.error('Access denied: insufficient permissions');
    }

    if (status === 500) {
      console.error('Server error:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;
