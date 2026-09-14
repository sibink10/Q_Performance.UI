export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

/** Roles an admin can assign from the Employees page. */
export type AssignableRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

/** Row shape for the admin Employees list (`GET /users`). */
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation?: string;
  role: UserRole;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId: string | null;
  department: string;
}

/** Current user's DB-sourced role/profile, as returned by GET /auth/me. */
export interface CurrentUserFromToken {
  id: string | null;
  email: string | null;
  role: string | null;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  employeeId: string | null;
  isManager: boolean;
}
