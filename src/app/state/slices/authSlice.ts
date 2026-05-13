// @ts-nocheck
// src/app/state/slices/authSlice.js
// Handles SSO auth state from Azure AD (MSAL)

import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAuthFromSso: (state, action) => {
      const { token, user } = action.payload || {};
      state.token = token || null;
      state.user = user || null;
      state.isAuthenticated = Boolean(token);
      state.isLoading = false;
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('qhrms_token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserRole = (state) => (state.auth.user?.role || 'EMPLOYEE').toUpperCase();
export const selectIsAdmin = (state) => selectUserRole(state) === 'ADMIN';
export const selectIsHr = (state) => selectUserRole(state) === 'HR';
export const selectIsManager = (state) =>
  selectUserRole(state) === 'ADMIN' || selectUserRole(state) === 'MANAGER';

export const { setAuthLoading, setAuthFromSso, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
