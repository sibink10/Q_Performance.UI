import type { AssignableEmployee } from '../types/user';

export function findEmployee(
  employees: AssignableEmployee[],
  id: string | null | undefined,
): AssignableEmployee | null {
  if (!id) return null;
  return employees.find((e) => e.id === id) ?? null;
}

export function directReportsOf(
  employees: AssignableEmployee[],
  managerId: string | null | undefined,
): AssignableEmployee[] {
  if (!managerId) return [];
  return employees.filter((e) => e.managerId === managerId);
}
