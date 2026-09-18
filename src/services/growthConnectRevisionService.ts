import api from './api';
import type { GrowthConnectRevision, GrowthConnectRevisionStatus } from '../types/growthConnectRevision';
import type { GoalStatus } from '../types/goal';
import type { RevisionReasonKey } from '../utils/revisionReasonConstants';

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

function mapRevision(raw: Record<string, unknown>): GrowthConnectRevision {
  return {
    id: String(raw.id ?? ''),
    entryId: String(raw.entryId ?? ''),
    goalId: String(raw.goalId ?? ''),
    goalTitle: String(raw.goalTitle ?? ''),
    cycleId: String(raw.cycleId ?? ''),
    cycleName: String(raw.cycleName ?? ''),
    employeeId: String(raw.employeeId ?? ''),
    employeeName: String(raw.employeeName ?? ''),
    requestedBy: String(raw.requestedById ?? ''),
    requestedByName: String(raw.requestedByName ?? ''),
    requestedAt: String(raw.requestedAt ?? ''),
    reason: String(raw.reason ?? '') as RevisionReasonKey,
    otherReason: raw.otherReason != null ? String(raw.otherReason) : undefined,
    proposedManagerStatus: raw.proposedManagerStatus != null ? (String(raw.proposedManagerStatus) as GoalStatus) : undefined,
    proposedManagerFeedback: raw.proposedManagerFeedback != null ? String(raw.proposedManagerFeedback) : undefined,
    status: (String(raw.status ?? '') || 'PENDING') as GrowthConnectRevisionStatus,
    reviewedBy: raw.reviewedById != null ? String(raw.reviewedById) : undefined,
    reviewedByName: raw.reviewedByName != null ? String(raw.reviewedByName) : undefined,
    reviewedAt: raw.reviewedAt != null ? String(raw.reviewedAt) : undefined,
    reviewComment: raw.reviewComment != null ? String(raw.reviewComment) : undefined,
  };
}

export interface SubmitGrowthConnectRevisionPayload {
  entryId: string;
  reason: RevisionReasonKey;
  otherReason?: string;
  proposedManagerStatus?: GoalStatus;
  proposedManagerFeedback?: string;
}

export interface ReviewGrowthConnectRevisionPayload {
  reviewComment?: string;
}

/** POST /performance/growth-connect-revisions — submitted by the manager, about their own status/feedback. */
export async function submitRevisionRequest(payload: SubmitGrowthConnectRevisionPayload): Promise<GrowthConnectRevision> {
  const response = await api.post('/performance/growth-connect-revisions', payload);
  const root = asRecord(response) ?? {};
  return mapRevision(asRecord(root.data) ?? {});
}

/** GET /performance/growth-connect-revisions — the full admin approval queue. */
export async function fetchPendingRevisions(): Promise<GrowthConnectRevision[]> {
  const payload = await api.get('/performance/growth-connect-revisions', { params: { pageSize: 100 } });
  return coerceItems(payload).map((row) => mapRevision(asRecord(row) ?? {}));
}

/** GET /performance/growth-connect-revisions/mine — the signed-in manager's own submissions. */
export async function fetchManagerRevisionRequests(): Promise<GrowthConnectRevision[]> {
  const payload = await api.get('/performance/growth-connect-revisions/mine');
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapRevision(asRecord(row) ?? {}));
}

/** POST /performance/growth-connect-revisions/{id}/approve */
export async function approveRevision(id: string, payload: ReviewGrowthConnectRevisionPayload): Promise<GrowthConnectRevision> {
  const response = await api.post(`/performance/growth-connect-revisions/${id}/approve`, {
    reviewComment: payload.reviewComment,
  });
  const root = asRecord(response) ?? {};
  return mapRevision(asRecord(root.data) ?? {});
}

/** POST /performance/growth-connect-revisions/{id}/reject */
export async function rejectRevision(id: string, payload: ReviewGrowthConnectRevisionPayload): Promise<GrowthConnectRevision> {
  const response = await api.post(`/performance/growth-connect-revisions/${id}/reject`, {
    reviewComment: payload.reviewComment,
  });
  const root = asRecord(response) ?? {};
  return mapRevision(asRecord(root.data) ?? {});
}

const growthConnectRevisionService = {
  submitRevisionRequest,
  fetchPendingRevisions,
  fetchManagerRevisionRequests,
  approveRevision,
  rejectRevision,
};

export default growthConnectRevisionService;
