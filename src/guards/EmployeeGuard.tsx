import { ReactNode } from 'react';
import RoleGuard from './RoleGuard';

type EmployeeGuardProps = {
  children: ReactNode;
};

const EmployeeGuard = ({ children }: EmployeeGuardProps) => (
  <RoleGuard allow={['EMPLOYEE', 'MANAGER', 'ADMIN']}>{children}</RoleGuard>
);

export default EmployeeGuard;
