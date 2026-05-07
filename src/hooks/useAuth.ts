// @ts-nocheck
// src/hooks/useAuth.js
// Custom hook for accessing auth state and actions

import { useDispatch, useSelector } from 'react-redux';
import { useMsal } from '@azure/msal-react';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsAdmin,
  selectIsManager,
  clearAuth,
  setAuthLoading,
  clearError,
} from '../app/state/slices/authSlice';
import { loginRequest } from '../services/msalConfig';

const useAuth = () => {
  const dispatch = useDispatch();
  const { instance } = useMsal();

  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAdmin = useSelector(selectIsAdmin);
  const isManager = useSelector(selectIsManager);

  const login = async () => {
    dispatch(setAuthLoading(true));
    try {
      await instance.loginRedirect(loginRequest);
    } catch {
      dispatch(clearAuth());
    }
  };

  const logout = async () => {
    dispatch(clearAuth());
    await instance.logoutRedirect({
      postLogoutRedirectUri: '/login',
    });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isManager,
    login,
    logout,
    clearError: () => dispatch(clearError()),
  };
};

export default useAuth;
