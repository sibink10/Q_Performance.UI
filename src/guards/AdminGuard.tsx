import { ReactNode } from 'react';
import RoleGuard from './RoleGuard';

type AdminGuardProps = {
  children: ReactNode;
};

const AdminGuard = ({ children }: AdminGuardProps) => (
  <RoleGuard allow={['ADMIN']} fallbackPath="/not-found">
    {children}
  </RoleGuard>
);

export default AdminGuard;
