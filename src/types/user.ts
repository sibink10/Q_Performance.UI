export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId: string | null;
  department: string;
}
