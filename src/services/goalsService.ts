import api from './api';
import type { Goal, GoalStatus } from '../types/goal';
import type { AssignableEmployee, UserRole } from '../types/user';
import goalCategoriesService from './goalCategoriesService';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Rows from the backend envelope `ApiResponse<PagedResult<T>>` -> `{ data: { data: [] } }`, or a bare array. */
function coerceItems(payload: unknown): unknown[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];

  const inner = asRecord(root.data);
  if (inner && Array.isArray(inner.data)) return inner.data;

  return Array.isArray(root.data) ? root.data : [];
}

function mapGoal(raw: Record<string, unknown>): Goal {
  const status = (String(raw.status ?? '') || 'ON_TRACK') as GoalStatus;
  return {
    id: String(raw.id ?? ''),
    financialYearId: String(raw.financialYearId ?? ''),
    employeeId: String(raw.employeeId ?? ''),
    category: String(raw.category ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    status,
    startDate: String(raw.startDate ?? ''),
    targetDate: String(raw.targetDate ?? ''),
    successCriteria: String(raw.successCriteria ?? ''),
    targetValue: raw.targetValue != null ? String(raw.targetValue) : undefined,
    // The backend always finalizes a goal on assignment — there is no draft state.
    isFinalized: true,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

function mapEmployee(raw: Record<string, unknown>): AssignableEmployee {
  return {
    id: String(raw.id ?? ''),
    employeeId: String(raw.employeeId ?? ''),
    name: String(raw.fullName ?? '') || 'Unnamed user',
    email: String(raw.email ?? ''),
    role: (String(raw.role ?? '') || 'EMPLOYEE').toUpperCase() as UserRole,
    managerId: raw.managerId != null ? String(raw.managerId) : null,
    department: String(raw.department ?? ''),
  };
}

/** Resolves a `GOAL_CATEGORY` code (e.g. "ORGANIZATIONAL") to its real `performance.GoalCategories.Id`. */
async function getCategoryIdByCode(code: string): Promise<string> {
  const categories = await goalCategoriesService.getActiveGoalCategories();
  const match = categories.find((c) => c.code === code);
  if (!match) throw new Error(`Goal category "${code}" was not found.`);
  return match.id;
}

export interface AssignGoalPayload {
  financialYearId: string;
  category: Goal['category'];
  title: string;
  description: string;
  successCriteria: string;
  startDate: string;
  targetDate: string;
  targetValue?: string;
  employeeIds: string[];
}

export interface UpdateGoalPayload {
  category: Goal['category'];
  title: string;
  description: string;
  successCriteria: string;
  startDate: string;
  targetDate: string;
  targetValue?: string;
  status: GoalStatus;
}

/** GET /performance/goals/assignable-employees */
export async function getAssignableEmployees(): Promise<AssignableEmployee[]> {
  const payload = await api.get('/performance/goals/assignable-employees');
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapEmployee(asRecord(row) ?? {}));
}

/** GET /performance/goals?employeeId=... */
export async function getGoalsByEmployee(employeeId: string): Promise<Goal[]> {
  const payload = await api.get('/performance/goals', { params: { employeeId, pageSize: 100 } });
  return coerceItems(payload).map((row) => mapGoal(asRecord(row) ?? {}));
}

/** GET /performance/goals — every goal across the org (admin "all goals" view). */
export async function getAllGoals(): Promise<Goal[]> {
  const payload = await api.get('/performance/goals', { params: { pageSize: 100 } });
  return coerceItems(payload).map((row) => mapGoal(asRecord(row) ?? {}));
}

/** All goals belonging to a manager's direct reports (no team filter server-side — filtered client-side). */
export async function getTeamGoals(managerId: string): Promise<Goal[]> {
  const employees = await getAssignableEmployees();
  const reportIds = new Set(employees.filter((e) => e.managerId === managerId).map((e) => e.id));
  const all = await getAllGoals();
  return all.filter((g) => reportIds.has(g.employeeId));
}

/** GET /performance/goals/{id} */
export async function getGoalById(id: string): Promise<Goal> {
  const payload = await api.get(`/performance/goals/${id}`);
  const root = asRecord(payload) ?? {};
  return mapGoal(asRecord(root.data) ?? {});
}

/** POST /performance/goals/assign — bulk-creates one goal per employeeId. */
export async function assignGoal(payload: AssignGoalPayload): Promise<Goal[]> {
  const categoryId = await getCategoryIdByCode(payload.category);
  const response = await api.post('/performance/goals/assign', {
    financialYearId: payload.financialYearId,
    categoryId,
    title: payload.title,
    description: payload.description,
    successCriteria: payload.successCriteria,
    targetValue: payload.targetValue,
    startDate: payload.startDate,
    targetDate: payload.targetDate,
    employeeIds: payload.employeeIds,
  });
  const root = asRecord(response) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapGoal(asRecord(row) ?? {}));
}

/** PUT /performance/goals/{id} — admin-only full edit. */
export async function updateGoal(id: string, payload: UpdateGoalPayload): Promise<Goal> {
  const categoryId = await getCategoryIdByCode(payload.category);
  const response = await api.put(`/performance/goals/${id}`, {
    categoryId,
    title: payload.title,
    description: payload.description,
    successCriteria: payload.successCriteria,
    targetValue: payload.targetValue,
    startDate: payload.startDate,
    targetDate: payload.targetDate,
    status: payload.status,
  });
  const root = asRecord(response) ?? {};
  return mapGoal(asRecord(root.data) ?? {});
}

/** DELETE /performance/goals/{id} */
export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`/performance/goals/${id}`);
}

const goalsService = {
  getAssignableEmployees,
  getGoalsByEmployee,
  getAllGoals,
  getTeamGoals,
  getGoalById,
  assignGoal,
  updateGoal,
  deleteGoal,
};

export default goalsService;
