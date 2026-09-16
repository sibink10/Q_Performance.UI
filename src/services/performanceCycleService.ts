import api from './api';
import type { PerformanceCycle, PerformanceCycleStatus } from '../types/performanceCycle';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mapCycle(raw: Record<string, unknown>): PerformanceCycle {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    startDate: String(raw.startDate ?? ''),
    endDate: String(raw.endDate ?? ''),
    status: (String(raw.status ?? '') || 'DRAFT') as PerformanceCycleStatus,
    // Stage timelines belong to a separate, not-yet-built feature — the backend has no stage concept.
    stages: [],
  };
}

export interface CreateCyclePayload {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateCyclePayload extends CreateCyclePayload {
  status: PerformanceCycleStatus;
}

/** GET /performance/cycles */
export async function getCycles(): Promise<PerformanceCycle[]> {
  const payload = await api.get('/performance/cycles');
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapCycle(asRecord(row) ?? {}));
}

/** GET /performance/cycles/{id} */
export async function getCycleById(id: string): Promise<PerformanceCycle> {
  const payload = await api.get(`/performance/cycles/${id}`);
  const root = asRecord(payload) ?? {};
  return mapCycle(asRecord(root.data) ?? {});
}

/** POST /performance/cycles */
export async function createCycle(payload: CreateCyclePayload): Promise<PerformanceCycle> {
  const response = await api.post('/performance/cycles', payload);
  const root = asRecord(response) ?? {};
  return mapCycle(asRecord(root.data) ?? {});
}

/** PUT /performance/cycles/{id} */
export async function updateCycle(id: string, payload: UpdateCyclePayload): Promise<PerformanceCycle> {
  const response = await api.put(`/performance/cycles/${id}`, payload);
  const root = asRecord(response) ?? {};
  return mapCycle(asRecord(root.data) ?? {});
}

/** DELETE /performance/cycles/{id} */
export async function deleteCycle(id: string): Promise<void> {
  await api.delete(`/performance/cycles/${id}`);
}

const performanceCycleService = {
  getCycles,
  getCycleById,
  createCycle,
  updateCycle,
  deleteCycle,
};

export default performanceCycleService;
