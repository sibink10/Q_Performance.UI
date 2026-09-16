import api from './api';
import type { AssignableRole, Employee, UserRole } from '../types/user';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Rows from API envelope `{ success, data: [] }` or `{ data: { data: [] } }` or a bare array. */
function coerceItems(payload: unknown): unknown[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];

  const inner = asRecord(root.data);
  if (inner && Array.isArray(inner.data)) return inner.data;

  const direct = root.items ?? root.value ?? root.employees ?? root.users ?? root.data;
  return Array.isArray(direct) ? direct : [];
}

function readNumber(record: Record<string, unknown> | null, keys: string[], fallback: number): number {
  if (!record) return fallback;
  for (const key of keys) {
    const v = record[key];
    if (typeof v === 'number') return v;
  }
  return fallback;
}

/** Paging metadata nested under `data` (`PagedResult<T>`: totalCount/page/pageSize/totalPages). */
function readPagingMeta(
  payload: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
): { page: number; pageSize: number; totalCount: number; totalPages: number } {
  const root = asRecord(payload);
  const inner = root ? asRecord(root.data) : null;

  const page = readNumber(inner, ['page'], fallbackPage);
  const pageSize = readNumber(inner, ['pageSize'], fallbackPageSize);
  const totalCount = readNumber(inner, ['totalCount'], 0);
  const totalPages = readNumber(inner, ['totalPages'], Math.max(1, Math.ceil(totalCount / pageSize)));

  return { page, pageSize, totalCount, totalPages };
}

function str(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && typeof v === 'string' && v.trim() !== '') return v;
    if (typeof v === 'number') return String(v);
  }
  return '';
}

function mapRawEmployee(raw: Record<string, unknown>, index: number): Employee {
  const id = raw.id ?? raw.userId ?? raw.employeeId;
  const name =
    str(raw, 'name', 'fullName', 'displayName') ||
    [str(raw, 'firstName'), str(raw, 'lastName')].filter(Boolean).join(' ') ||
    'Unnamed user';
  const role = (str(raw, 'role') || 'EMPLOYEE').toUpperCase() as UserRole;

  return {
    id: id !== undefined && id !== null ? String(id) : `row-${index}`,
    name,
    email: str(raw, 'email', 'mail', 'userPrincipalName'),
    department: str(raw, 'department', 'departmentName'),
    designation: str(raw, 'designation', 'jobTitle', 'title') || undefined,
    phoneNumber: str(raw, 'phoneNumber', 'phone', 'mobile'),
    role,
  };
}

export interface EmployeesPage {
  employees: Employee[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** GET /users - a page of app employees with their current role. Server clamps pageSize to 1-100. */
export async function getAllEmployees(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<EmployeesPage> {
  const queryParams: Record<string, string | number> = {
    page: params.page,
    pageSize: params.pageSize,
  };
  if (params.search) queryParams.search = params.search;

  const payload = await api.get('/users', { params: queryParams });
  const employees = coerceItems(payload).map((row, i) =>
    mapRawEmployee((row && typeof row === 'object' ? row : {}) as Record<string, unknown>, i),
  );
  const meta = readPagingMeta(payload, params.page, params.pageSize);

  return { employees, ...meta };
}

/** GET /users/roles - roles an admin can assign to an employee. */
export async function getAssignableRoles(): Promise<AssignableRole[]> {
  const payload = await api.get('/users/roles');
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => {
    const r = asRecord(row) ?? {};
    return {
      id: readNumber(r, ['id'], 0),
      code: (str(r, 'code') || 'EMPLOYEE').toUpperCase() as AssignableRole['code'],
      displayName: str(r, 'displayName') || str(r, 'code'),
    };
  });
}

/** PUT /users/:id/role - update an employee's role. */
export async function updateEmployeeRole(id: string, roleId: number): Promise<Employee> {
  const payload = await api.put(`/users/${id}/role`, { roleId });
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  return mapRawEmployee(data, 0);
}
