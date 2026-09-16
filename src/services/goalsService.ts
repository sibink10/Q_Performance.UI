import api from './api';
import type { Goal, GoalStatus } from '../types/goal';
import type { AssignableEmployee, UserRole } from '../types/user';
import type { PerformanceCycle, PerformanceCycleStatus } from '../types/performanceCycle';
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

/** Display-only progress derived from status — the backend has no Progress column. */
const STATUS_PROGRESS: Record<GoalStatus, number> = {
  COMPLETED: 100,
  ON_TRACK: 70,
  NEEDS_ATTENTION: 45,
  OFF_TRACK: 20,
};

function mapGoal(raw: Record<string, unknown>): Goal {
  const status = (String(raw.status ?? '') || 'ON_TRACK') as GoalStatus;
  return {
    id: String(raw.id ?? ''),
    cycleId: String(raw.cycleId ?? ''),
    employeeId: String(raw.employeeId ?? ''),
    category: String(raw.category ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    weight: Number(raw.weight ?? 0),
    status,
    progress: STATUS_PROGRESS[status] ?? 0,
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
    name: String(raw.fullName ?? '') || 'Unnamed user',
    email: String(raw.email ?? ''),
    role: (String(raw.role ?? '') || 'EMPLOYEE').toUpperCase() as UserRole,
    managerId: raw.managerId != null ? String(raw.managerId) : null,
    department: String(raw.department ?? ''),
  };
}

function mapCycle(raw: Record<string, unknown>): PerformanceCycle {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    startDate: String(raw.startDate ?? ''),
    endDate: String(raw.endDate ?? ''),
    status: (String(raw.status ?? '') || 'DRAFT') as PerformanceCycleStatus,
    // Stage timelines belong to the separate (still-mocked) Performance Cycles config page.
    stages: [],
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
  cycleId: string;
  category: Goal['category'];
  title: string;
  description: string;
  successCriteria: string;
  weight: number;
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
  weight: number;
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

/** GET /performance/cycles — feeds the Assign Goal modal's cycle picker only. */
export async function getCycles(): Promise<PerformanceCycle[]> {
  const payload = await api.get('/performance/cycles');
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapCycle(asRecord(row) ?? {}));
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
    cycleId: payload.cycleId,
    categoryId,
    title: payload.title,
    description: payload.description,
    successCriteria: payload.successCriteria,
    targetValue: payload.targetValue,
    weight: payload.weight,
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
    weight: payload.weight,
    startDate: payload.startDate,
    targetDate: payload.targetDate,
    status: payload.status,
  });
  const root = asRecord(response) ?? {};
  return mapGoal(asRecord(root.data) ?? {});
}

/** PUT /performance/goals/{id}/status — manager-or-admin status-only quick change. */
export async function updateStatus(id: string, status: GoalStatus): Promise<Goal> {
  const response = await api.put(`/performance/goals/${id}/status`, { status });
  const root = asRecord(response) ?? {};
  return mapGoal(asRecord(root.data) ?? {});
}

/** DELETE /performance/goals/{id} */
export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`/performance/goals/${id}`);
}

const goalsService = {
  getAssignableEmployees,
  getCycles,
  getGoalsByEmployee,
  getAllGoals,
  getTeamGoals,
  getGoalById,
  assignGoal,
  updateGoal,
  updateStatus,
  deleteGoal,
};

export default goalsService;
