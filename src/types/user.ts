export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

/** A role an admin can assign from the Employees page, as returned by `GET /users/roles`. */
export interface AssignableRole {
  id: number;
  code: UserRole;
  displayName: string;
}

/** Row shape for the admin Employees list (`GET /users`). */
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation?: string;
  phoneNumber: string;
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

/** Employee assignable to a goal, as returned by `GET /performance/goals/assignable-employees`. */
export interface AssignableEmployee {
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
