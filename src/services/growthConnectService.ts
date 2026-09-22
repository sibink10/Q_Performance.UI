import api from './api';
import type { GoalGrowthConnectEntry, GrowthConnectCycle } from '../types/growthConnect';
import type { GoalStatus } from '../types/goal';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function coerceItems(payload: unknown): unknown[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];
  return Array.isArray(root.data) ? root.data : [];
}

function mapCycle(raw: Record<string, unknown>): GrowthConnectCycle {
  return {
    id: String(raw.id ?? ''),
    financialYearId: String(raw.financialYearId ?? ''),
    name: String(raw.name ?? ''),
    sequenceNo: Number(raw.sequenceNo ?? 0),
    startDate: String(raw.startDate ?? ''),
    endDate: String(raw.endDate ?? ''),
    status: (String(raw.status ?? '') || 'DRAFT') as GrowthConnectCycle['status'],
    createdByName: raw.createdByName != null ? String(raw.createdByName) : undefined,
  };
}

function mapEntry(raw: Record<string, unknown>): GoalGrowthConnectEntry {
  return {
    id: String(raw.id ?? ''),
    goalId: String(raw.goalId ?? ''),
    cycleId: String(raw.cycleId ?? ''),
    cycleName: String(raw.cycleName ?? ''),
    cycleSequenceNo: Number(raw.cycleSequenceNo ?? 0),
    cycleStatus: (String(raw.cycleStatus ?? '') || 'DRAFT') as GoalGrowthConnectEntry['cycleStatus'],
    cycleStartDate: String(raw.cycleStartDate ?? ''),
    cycleEndDate: String(raw.cycleEndDate ?? ''),
    employeeUpdate: raw.employeeUpdate != null ? String(raw.employeeUpdate) : undefined,
    employeeSubmittedAt: raw.employeeSubmittedAt != null ? String(raw.employeeSubmittedAt) : undefined,
    employeeSubmittedByName: raw.employeeSubmittedByName != null ? String(raw.employeeSubmittedByName) : undefined,
    managerStatus: raw.managerStatus != null ? (String(raw.managerStatus) as GoalStatus) : undefined,
    managerFeedback: raw.managerFeedback != null ? String(raw.managerFeedback) : undefined,
    managerSubmittedAt: raw.managerSubmittedAt != null ? String(raw.managerSubmittedAt) : undefined,
    managerSubmittedByName: raw.managerSubmittedByName != null ? String(raw.managerSubmittedByName) : undefined,
    isEmployeeEditable: Boolean(raw.isEmployeeEditable),
    isManagerEditable: Boolean(raw.isManagerEditable),
  };
}

/** GET /performance/growth-connect/financial-years/{financialYearId}/cycles */
export async function fetchCycles(financialYearId: string): Promise<GrowthConnectCycle[]> {
  const payload = await api.get(`/performance/growth-connect/financial-years/${financialYearId}/cycles`);
  return coerceItems(payload).map((row) => mapCycle(asRecord(row) ?? {}));
}

/** GET /performance/growth-connect/cycles/active — cycles for the active financial year, any role. */
export async function fetchActiveCycles(): Promise<GrowthConnectCycle[]> {
  const payload = await api.get('/performance/growth-connect/cycles/active');
  return coerceItems(payload).map((row) => mapCycle(asRecord(row) ?? {}));
}

/** POST /performance/growth-connect/financial-years/{financialYearId}/cycles */
export async function createCycle(
  financialYearId: string,
  payload: { name: string; startDate: string; endDate: string },
): Promise<GrowthConnectCycle> {
  const response = await api.post(`/performance/growth-connect/financial-years/${financialYearId}/cycles`, payload);
  const root = asRecord(response) ?? {};
  return mapCycle(asRecord(root.data) ?? {});
}

/** PUT /performance/growth-connect/cycles/{id} — only while still DRAFT */
export async function updateCycle(
  id: string,
  payload: { name: string; startDate: string; endDate: string },
): Promise<GrowthConnectCycle> {
  const response = await api.put(`/performance/growth-connect/cycles/${id}`, payload);
  const root = asRecord(response) ?? {};
  return mapCycle(asRecord(root.data) ?? {});
}

/** POST /performance/growth-connect/cycles/{id}/open */
export async function openCycle(id: string): Promise<GrowthConnectCycle> {
  const response = await api.post(`/performance/growth-connect/cycles/${id}/open`);
  const root = asRecord(response) ?? {};
  return mapCycle(asRecord(root.data) ?? {});
}

/** POST /performance/growth-connect/cycles/{id}/close */
export async function closeCycle(id: string): Promise<GrowthConnectCycle> {
  const response = await api.post(`/performance/growth-connect/cycles/${id}/close`);
  const root = asRecord(response) ?? {};
  return mapCycle(asRecord(root.data) ?? {});
}

/** DELETE /performance/growth-connect/cycles/{id} */
export async function deleteCycle(id: string): Promise<void> {
  await api.delete(`/performance/growth-connect/cycles/${id}`);
}

/** GET /performance/growth-connect/goals/{goalId}/entries */
export async function fetchGoalEntries(goalId: string): Promise<GoalGrowthConnectEntry[]> {
  const payload = await api.get(`/performance/growth-connect/goals/${goalId}/entries`);
  return coerceItems(payload).map((row) => mapEntry(asRecord(row) ?? {}));
}

/** POST /performance/growth-connect/entries/{entryId}/employee-update */
export async function submitEmployeeUpdate(entryId: string, employeeUpdate: string): Promise<GoalGrowthConnectEntry> {
  const response = await api.post(`/performance/growth-connect/entries/${entryId}/employee-update`, { employeeUpdate });
  const root = asRecord(response) ?? {};
  return mapEntry(asRecord(root.data) ?? {});
}

/** POST /performance/growth-connect/entries/{entryId}/manager-feedback */
export async function submitManagerFeedback(
  entryId: string,
  managerStatus: GoalStatus,
  managerFeedback: string,
): Promise<GoalGrowthConnectEntry> {
  const response = await api.post(`/performance/growth-connect/entries/${entryId}/manager-feedback`, {
    managerStatus,
    managerFeedback,
  });
  const root = asRecord(response) ?? {};
  return mapEntry(asRecord(root.data) ?? {});
}

const growthConnectService = {
  fetchCycles,
  fetchActiveCycles,
  createCycle,
  updateCycle,
  openCycle,
  closeCycle,
  deleteCycle,
  fetchGoalEntries,
  submitEmployeeUpdate,
  submitManagerFeedback,
};

export default growthConnectService;
