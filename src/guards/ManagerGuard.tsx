import { ReactNode } from 'react';
import RoleGuard from './RoleGuard';

type ManagerGuardProps = {
  children: ReactNode;
};

const ManagerGuard = ({ children }: ManagerGuardProps) => (
  <RoleGuard allow={['ADMIN', 'MANAGER']}>{children}</RoleGuard>
);

export default ManagerGuard;
