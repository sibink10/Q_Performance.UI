import { mockUsers } from '../services/mock/mockData/users';
import type { UserRole } from '../types/user';

type AuthUserLike = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
};

const ROLE_FALLBACK_IDS: Record<UserRole, string> = {
  ADMIN: 'usr-001',
  HR: 'usr-002',
  MANAGER: 'usr-003',
  EMPLOYEE: 'usr-006',
};

/**
 * Maps an authenticated user to a mock seed user id (email match, then role fallback).
 */
export function resolveMockUserId(authUser: AuthUserLike | null | undefined): string {
  if (!authUser) {
    return ROLE_FALLBACK_IDS.EMPLOYEE;
  }

  const email = String(authUser.email || '').trim().toLowerCase();
  if (email) {
    const matched = mockUsers.find((user) => user.email.toLowerCase() === email);
    if (matched) {
      return matched.id;
    }
  }

  const role = String(authUser.role || 'EMPLOYEE').toUpperCase() as UserRole;
  if (role in ROLE_FALLBACK_IDS) {
    return ROLE_FALLBACK_IDS[role];
  }

  return ROLE_FALLBACK_IDS.EMPLOYEE;
}

export function getMockUserById(userId: string) {
  return mockUsers.find((user) => user.id === userId) ?? null;
}

export function getDirectReports(managerId: string) {
  return mockUsers.filter((user) => user.managerId === managerId && user.role === 'EMPLOYEE');
}
