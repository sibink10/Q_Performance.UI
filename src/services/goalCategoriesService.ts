import api from './api';
import type {
  CreateGoalCategoryPayload,
  GoalCategoryDto,
  UpdateGoalCategoryPayload,
} from '../types/goalCategory';

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

function mapCategory(raw: Record<string, unknown>): GoalCategoryDto {
  return {
    id: String(raw.id ?? ''),
    code: String(raw.code ?? ''),
    description: String(raw.description ?? ''),
    isActive: Boolean(raw.isActive),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

/** GET /performance/goal-categories */
export async function getGoalCategories(): Promise<GoalCategoryDto[]> {
  const payload = await api.get('/performance/goal-categories', { params: { pageSize: 100 } });
  return coerceItems(payload).map((row) => mapCategory((row ?? {}) as Record<string, unknown>));
}

/** GET /performance/goal-categories/active */
export async function getActiveGoalCategories(): Promise<GoalCategoryDto[]> {
  const payload = await api.get('/performance/goal-categories/active');
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapCategory((row ?? {}) as Record<string, unknown>));
}

/** POST /performance/goal-categories */
export async function createGoalCategory(payload: CreateGoalCategoryPayload): Promise<GoalCategoryDto> {
  const response = await api.post('/performance/goal-categories', payload);
  const root = asRecord(response) ?? {};
  return mapCategory(asRecord(root.data) ?? {});
}

/** PUT /performance/goal-categories/:id */
export async function updateGoalCategory(
  id: string,
  payload: UpdateGoalCategoryPayload,
): Promise<GoalCategoryDto> {
  const response = await api.put(`/performance/goal-categories/${id}`, payload);
  const root = asRecord(response) ?? {};
  return mapCategory(asRecord(root.data) ?? {});
}

/** DELETE /performance/goal-categories/:id */
export async function deleteGoalCategory(id: string): Promise<void> {
  await api.delete(`/performance/goal-categories/${id}`);
}

const goalCategoriesService = {
  getGoalCategories,
  getActiveGoalCategories,
  createGoalCategory,
  updateGoalCategory,
  deleteGoalCategory,
};

export default goalCategoriesService;
