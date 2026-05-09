// @ts-nocheck
// src/routes/PrivateRoute
// Wraps protected pages - redirects to login if no valid JWT

import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsAdmin } from '../app/state/slices/authSlice';

/**
 * PrivateRoute - requires authentication.
 * Optionally requires admin role with requireAdmin prop.
 */
const PrivateRoute = ({ children, requireAdmin = false }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Admin-only route accessed by regular employee
    return <Navigate to="/performance" replace />;
  }

  return children;
};

export default PrivateRoute;
