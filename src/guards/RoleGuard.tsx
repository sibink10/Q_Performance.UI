import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../app/state/slices/authSlice';

type AllowedRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

type RoleGuardProps = {
  children: ReactNode;
  allow: AllowedRole[];
  fallbackPath?: string;
};

const RoleGuard = ({ children, allow, fallbackPath = '/performance' }: RoleGuardProps) => {
  const role = useSelector(selectUserRole);
  const normalizedRole = (role || 'EMPLOYEE').toUpperCase() as AllowedRole;

  if (!allow.includes(normalizedRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
