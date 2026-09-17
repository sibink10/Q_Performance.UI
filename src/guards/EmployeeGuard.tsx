import { ReactNode } from 'react';
import RoleGuard from './RoleGuard';

type EmployeeGuardProps = {
  children: ReactNode;
};

const EmployeeGuard = ({ children }: EmployeeGuardProps) => (
  <RoleGuard allow={['EMPLOYEE', 'MANAGER', 'ADMIN']} fallbackPath="/not-found">{children}</RoleGuard>
);

export default EmployeeGuard;
