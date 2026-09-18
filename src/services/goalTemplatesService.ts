import api from './api';
import type { GoalTemplate } from '../types/goalTemplate';

export interface CreateGoalTemplatePayload {
  categoryId: string;
  title: string;
  description: string;
  successCriteria: string;
}

export type UpdateGoalTemplatePatch = CreateGoalTemplatePayload;

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

function mapTemplate(raw: Record<string, unknown>): GoalTemplate {
  return {
    id: String(raw.id ?? ''),
    categoryId: String(raw.categoryId ?? ''),
    category: String(raw.category ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    successCriteria: String(raw.successCriteria ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

/** GET /performance/goal-templates */
export async function getGoalTemplates(): Promise<GoalTemplate[]> {
  const payload = await api.get('/performance/goal-templates', { params: { pageSize: 100 } });
  return coerceItems(payload).map((row) => mapTemplate((row ?? {}) as Record<string, unknown>));
}

/** GET /performance/goal-templates/:id */
export async function getGoalTemplateById(id: string): Promise<GoalTemplate> {
  const response = await api.get(`/performance/goal-templates/${id}`);
  const root = asRecord(response) ?? {};
  return mapTemplate(asRecord(root.data) ?? {});
}

/** POST /performance/goal-templates */
export async function createGoalTemplate(payload: CreateGoalTemplatePayload): Promise<GoalTemplate> {
  const response = await api.post('/performance/goal-templates', payload);
  const root = asRecord(response) ?? {};
  return mapTemplate(asRecord(root.data) ?? {});
}

/** PUT /performance/goal-templates/:id */
export async function updateGoalTemplate(id: string, payload: UpdateGoalTemplatePatch): Promise<GoalTemplate> {
  const response = await api.put(`/performance/goal-templates/${id}`, payload);
  const root = asRecord(response) ?? {};
  return mapTemplate(asRecord(root.data) ?? {});
}

/** DELETE /performance/goal-templates/:id */
export async function deleteGoalTemplate(id: string): Promise<void> {
  await api.delete(`/performance/goal-templates/${id}`);
}

const goalTemplatesService = {
  getGoalTemplates,
  getGoalTemplateById,
  createGoalTemplate,
  updateGoalTemplate,
  deleteGoalTemplate,
};

export default goalTemplatesService;
