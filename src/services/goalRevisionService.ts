import api from './api';
import type { GoalHistoryAction, GoalHistoryEntry } from '../types/goalHistory';
import type { GoalRevision, GoalRevisionStatus, ProposedGoalChanges } from '../types/goalRevision';
import type { RevisionReasonKey } from '../utils/revisionReasonConstants';
import goalCategoriesService from './goalCategoriesService';

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

  const inner = asRecord(root.data);
  if (inner && Array.isArray(inner.data)) return inner.data;

  return Array.isArray(root.data) ? root.data : [];
}

/** Resolves a `GOAL_CATEGORY` code (e.g. "ORGANIZATIONAL") to its real `performance.GoalCategories.Id`. */
async function getCategoryIdByCode(code: string): Promise<string> {
  const categories = await goalCategoriesService.getActiveGoalCategories();
  const match = categories.find((c) => c.code === code);
  if (!match) throw new Error(`Goal category "${code}" was not found.`);
  return match.id;
}

async function buildProposedChangesBody(changes: ProposedGoalChanges) {
  return {
    title: changes.title,
    description: changes.description,
    targetValue: changes.targetValue,
    measurementCriteria: changes.measurementCriteria,
    dueDate: changes.dueDate,
    categoryId: changes.category ? await getCategoryIdByCode(changes.category) : undefined,
  };
}

function mapRevision(raw: Record<string, unknown>): GoalRevision {
  const pc = asRecord(raw.proposedChanges) ?? {};
  return {
    id: String(raw.id ?? ''),
    goalId: String(raw.goalId ?? ''),
    goalTitle: raw.goalTitle != null ? String(raw.goalTitle) : undefined,
    employeeId: String(raw.employeeId ?? ''),
    employeeName: String(raw.employeeName ?? ''),
    requestedBy: String(raw.requestedById ?? ''),
    requestedByName: String(raw.requestedByName ?? ''),
    requestedAt: String(raw.requestedAt ?? ''),
    reason: String(raw.reason ?? '') as RevisionReasonKey,
    otherReason: raw.otherReason != null ? String(raw.otherReason) : undefined,
    proposedChanges: {
      title: pc.title != null ? String(pc.title) : undefined,
      description: pc.description != null ? String(pc.description) : undefined,
      targetValue: pc.targetValue != null ? String(pc.targetValue) : undefined,
      measurementCriteria: pc.measurementCriteria != null ? String(pc.measurementCriteria) : undefined,
      dueDate: pc.dueDate != null ? String(pc.dueDate) : undefined,
      category: pc.category != null ? String(pc.category) : undefined,
    },
    status: (String(raw.status ?? '') || 'PENDING') as GoalRevisionStatus,
    reviewedBy: raw.reviewedById != null ? String(raw.reviewedById) : undefined,
    reviewedByName: raw.reviewedByName != null ? String(raw.reviewedByName) : undefined,
    reviewedAt: raw.reviewedAt != null ? String(raw.reviewedAt) : undefined,
    reviewComment: raw.reviewComment != null ? String(raw.reviewComment) : undefined,
  };
}

function mapHistoryEntry(raw: Record<string, unknown>): GoalHistoryEntry {
  return {
    id: String(raw.id ?? ''),
    goalId: String(raw.goalId ?? ''),
    date: String(raw.createdAt ?? ''),
    action: String(raw.action ?? '') as GoalHistoryAction,
    field: raw.field != null ? String(raw.field) : undefined,
    oldValue: raw.oldValue != null ? String(raw.oldValue) : undefined,
    newValue: raw.newValue != null ? String(raw.newValue) : undefined,
    reason: raw.reason != null ? String(raw.reason) : undefined,
    requestedBy: raw.requestedById != null ? String(raw.requestedById) : undefined,
    requestedByName: raw.requestedByName != null ? String(raw.requestedByName) : undefined,
    approvedBy: raw.approvedById != null ? String(raw.approvedById) : undefined,
    approvedByName: raw.approvedByName != null ? String(raw.approvedByName) : undefined,
    comment: raw.comment != null ? String(raw.comment) : undefined,
    revisionRequestId: raw.revisionRequestId != null ? String(raw.revisionRequestId) : undefined,
  };
}

export interface SubmitRevisionRequestPayload {
  goalId: string;
  employeeId: string;
  reason: RevisionReasonKey;
  otherReason?: string;
  proposedChanges: ProposedGoalChanges;
}

export interface ReviewRevisionPayload {
  reviewComment?: string;
}

/** POST /performance/goal-revisions — submitted by the goal's employee's manager. */
export async function submitRevisionRequest(payload: SubmitRevisionRequestPayload): Promise<GoalRevision> {
  const proposedChanges = await buildProposedChangesBody(payload.proposedChanges);
  const response = await api.post('/performance/goal-revisions', {
    goalId: payload.goalId,
    reason: payload.reason,
    otherReason: payload.otherReason,
    proposedChanges,
  });
  const root = asRecord(response) ?? {};
  return mapRevision(asRecord(root.data) ?? {});
}

/** GET /performance/goal-revisions — the full admin/HR approval queue. */
export async function fetchPendingRevisions(): Promise<GoalRevision[]> {
  const payload = await api.get('/performance/goal-revisions', { params: { pageSize: 100 } });
  return coerceItems(payload).map((row) => mapRevision(asRecord(row) ?? {}));
}

/** GET /performance/goal-revisions/mine — the signed-in manager's own submissions. */
export async function fetchManagerRevisionRequests(): Promise<GoalRevision[]> {
  const payload = await api.get('/performance/goal-revisions/mine');
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapRevision(asRecord(row) ?? {}));
}

/** POST /performance/goal-revisions/{id}/approve */
export async function approveRevision(id: string, payload: ReviewRevisionPayload): Promise<GoalRevision> {
  const response = await api.post(`/performance/goal-revisions/${id}/approve`, {
    reviewComment: payload.reviewComment,
  });
  const root = asRecord(response) ?? {};
  return mapRevision(asRecord(root.data) ?? {});
}

/** POST /performance/goal-revisions/{id}/reject */
export async function rejectRevision(id: string, payload: ReviewRevisionPayload): Promise<GoalRevision> {
  const response = await api.post(`/performance/goal-revisions/${id}/reject`, {
    reviewComment: payload.reviewComment,
  });
  const root = asRecord(response) ?? {};
  return mapRevision(asRecord(root.data) ?? {});
}

/** GET /performance/goals/{goalId}/history */
export async function fetchGoalHistory(goalId: string): Promise<GoalHistoryEntry[]> {
  const payload = await api.get(`/performance/goals/${goalId}/history`);
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapHistoryEntry(asRecord(row) ?? {}));
}

const goalRevisionService = {
  submitRevisionRequest,
  fetchPendingRevisions,
  fetchManagerRevisionRequests,
  approveRevision,
  rejectRevision,
  fetchGoalHistory,
};

export default goalRevisionService;
