// @ts-nocheck
// Maps GET /api/performance/my-reviews payloads into the shape expected by the UI.

import { REVIEW_STATUSES } from './constants';

const SUBMITTED_LIKE = new Set(
  [
    REVIEW_STATUSES.SUBMITTED,
    REVIEW_STATUSES.COMPLETED,
    'Submitted',
    'Completed',
    'submitted',
    'completed',
    'SUBMITTED',
    'COMPLETED',
  ].map((s) => String(s).toLowerCase())
);

const STATUS_NORMALIZE = {
  notstarted: REVIEW_STATUSES.NOT_STARTED,
  not_started: REVIEW_STATUSES.NOT_STARTED,
  'not started': REVIEW_STATUSES.NOT_STARTED,
  draft: REVIEW_STATUSES.DRAFT_SAVED,
  draftsaved: REVIEW_STATUSES.DRAFT_SAVED,
  draft_saved: REVIEW_STATUSES.DRAFT_SAVED,
  inprogress: REVIEW_STATUSES.IN_PROGRESS,
  in_progress: REVIEW_STATUSES.IN_PROGRESS,
  selfevaluationinprogress: REVIEW_STATUSES.IN_PROGRESS,
  submitted: REVIEW_STATUSES.SUBMITTED,
  completed: REVIEW_STATUSES.COMPLETED,
};

/**
 * Map API / alternate field names onto the review card / table row shape.
 */
export function mapMyReviewItem(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id =
    raw.id ??
    raw.reviewId ??
    raw.assignmentId ??
    raw.evaluationId ??
    raw.reviewAssignmentId ??
    raw.employeeReviewId;

  if (id == null || id === '') return null;

  /** Prefer explicit assignment GUID for endpoints like GET /performance/my-results/:assignmentId */
  const assignmentId =
    raw.assignmentId ??
    raw.reviewAssignmentId ??
    raw.reviewAssignment?.id ??
    raw.reviewAssignment?.assignmentId ??
    id;

  const formName =
    raw.formName ??
    raw.reviewFormName ??
    raw.formTitle ??
    raw.title ??
    'Review';

  const rawStatus = raw.status ?? raw.selfEvaluationStatus ?? raw.selfEvalStatus ?? raw.phase;
  const statusKey = String(rawStatus ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');
  const status = STATUS_NORMALIZE[statusKey] ?? rawStatus ?? REVIEW_STATUSES.NOT_STARTED;

  const startDate =
    // For employee "My Reviews" pending cards, backend provides explicit self-eval window.
    raw.selfEvalStart ??
    raw.selfEvaluationStart ??
    raw.startDate ??
    raw.fromDate ??
    raw.from_date ??
    raw.reviewStartDate ??
    raw.review_start_date ??
    raw.selfEvalStart ??
    raw.selfEvaluationStart ??
    raw.periodStart ??
    raw.evaluationStartDate ??
    raw.start_date ??
    raw.period_start ??
    raw.evaluation_start_date ??
    null;
  const endDate =
    // Prefer explicit self-eval end window when present.
    raw.selfEvalEnd ??
    raw.selfEvaluationEnd ??
    raw.endDate ??
    raw.periodEnd ??
    raw.evaluationEndDate ??
    raw.deadline ??
    raw.end_date ??
    raw.period_end ??
    raw.evaluation_end_date ??
    null;

  const completionPct =
    raw.completionPct ??
    raw.completionPercentage ??
    raw.progressPercent ??
    (typeof raw.completion === 'number' ? Math.round(raw.completion * 100) : 0);

  const submittedAt = raw.submittedAt ?? raw.selfEvaluationSubmittedAt ?? raw.submittedOn ?? null;

  const managerStatus =
    raw.managerStatus ??
    raw.managerEvaluationStatus ??
    raw.managerEvalStatus ??
    'Pending';
  const hrStatus =
    raw.hrStatus ??
    raw.hrReviewStatus ??
    raw.hrEvaluationStatus ??
    'Pending';

  const managerEmail =
    raw.managerEmail ??
    raw.manager_email ??
    raw.reviewerEmail ??
    raw.reviewer_email ??
    raw.reportingManagerEmail ??
    raw.reporting_manager_email ??
    (raw.manager && typeof raw.manager === 'object' ? raw.manager.email : null) ??
    (raw.managerDetails && typeof raw.managerDetails === 'object'
      ? raw.managerDetails.email
      : null) ??
    (raw.reviewer && typeof raw.reviewer === 'object' ? raw.reviewer.email : null) ??
    null;

  return {
    id: String(id),
    assignmentId: String(assignmentId),
    formName,
    status,
    startDate,
    endDate,
    completionPct: Math.min(100, Math.max(0, Number(completionPct) || 0)),
    submittedAt,
    managerStatus,
    hrStatus,
    managerEmail: managerEmail != null && String(managerEmail).trim() !== '' ? String(managerEmail).trim() : null,
  };
}

function isSubmittedLike(status) {
  if (status == null) return false;
  return SUBMITTED_LIKE.has(String(status).toLowerCase());
}

function partitionList(list) {
  const pending = [];
  const submitted = [];
  for (const raw of list) {
    const row = mapMyReviewItem(raw);
    if (!row) continue;
    if (isSubmittedLike(row.status)) submitted.push(row);
    else pending.push(row);
  }
  return { pending, submitted };
}

/**
 * Accepts:
 * - { pending, submitted } (camel or PascalCase)
 * - A flat array of review assignments (split by status)
 * - A single object (wrapped as one-item list)
 */
export function normalizeMyReviewsResponse(payload) {
  const empty = { pending: [], submitted: [] };
  if (payload == null) return empty;

  /** Support `{ success, data: [...] }` after axios unwraps `response.data`. */
  let body = payload;
  if (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    Object.prototype.hasOwnProperty.call(body, 'data')
  ) {
    body = body.data;
    if (
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      Object.prototype.hasOwnProperty.call(body, 'data')
    ) {
      body = body.data;
    }
  }
  if (body == null) return empty;

  if (Array.isArray(body)) return partitionList(body);

  const pendingRaw = body.pending ?? body.Pending;
  const submittedRaw = body.submitted ?? body.Submitted;

  if (Array.isArray(pendingRaw) || Array.isArray(submittedRaw)) {
    const pending = (Array.isArray(pendingRaw) ? pendingRaw : []).map(mapMyReviewItem).filter(Boolean);
    const submitted = (Array.isArray(submittedRaw) ? submittedRaw : []).map(mapMyReviewItem).filter(Boolean);
    return { pending, submitted };
  }

  if (typeof body === 'object') {
    return partitionList([body]);
  }

  return empty;
}

/** Rows for a dedicated pending/submitted list response (array or `{ data }` wrapper). */
export function flattenMyReviewsToRows(payload) {
  const { pending, submitted } = normalizeMyReviewsResponse(payload);
  return [...pending, ...submitted];
}
