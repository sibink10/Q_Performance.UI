// @ts-nocheck
// Maps GET /performance/my-results list and GET /performance/my-results/:assignmentId payloads.

import { toArrayFromPayload, toEntityFromPayload } from './helpers';

/** Row shape for the My Results assignments table. */
export function mapMyResultListItem(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const assignmentId =
    raw.assignmentId ??
    raw.id ??
    raw.reviewAssignmentId ??
    raw.reviewId ??
    raw.evaluationAssignmentId;

  if (assignmentId == null || assignmentId === '') return null;

  const formName =
    raw.formName ??
    raw.reviewFormName ??
    raw.formTitle ??
    raw.title ??
    'Performance review';

  const period =
    raw.period ??
    raw.financialYear ??
    raw.fiscalYear ??
    raw.appraisalCycleName ??
    '-';

  const publishedDate =
    raw.publishedDate ??
    raw.publishedAt ??
    raw.finalizedDate ??
    raw.completedAt ??
    null;

  const finalRating = raw.finalRating ?? raw.finalScore ?? raw.overallRating ?? raw.overallScore;
  const ratingScale = raw.ratingScale ?? raw.scale ?? raw.maxRating ?? 5;

  const managerName =
    raw.managerName ??
    raw.reviewerName ??
    raw.reportingManagerName ??
    '-';

  return {
    assignmentId: String(assignmentId),
    formName: String(formName),
    period: String(period),
    publishedDate,
    finalRating: finalRating != null && finalRating !== '' ? Number(finalRating) : null,
    ratingScale: Number(ratingScale) || 5,
    managerName: String(managerName),
  };
}

export function normalizeMyResultsListPayload(raw) {
  const arr = toArrayFromPayload(raw);
  let rows = arr.map(mapMyResultListItem).filter(Boolean);
  if (!rows.length && raw && typeof raw === 'object') {
    const maybe = mapMyResultListItem(toEntityFromPayload(raw));
    if (maybe) rows = [maybe];
  }
  return rows;
}

function mapFocusAreaRow(fa) {
  if (!fa || typeof fa !== 'object') return null;
  const name =
    fa.name ??
    fa.focusAreaName ??
    fa.title ??
    fa.categoryName ??
    'Focus area';
  const selfScore = fa.selfScore ?? fa.selfRating ?? fa.self ?? null;
  const managerScore = fa.managerScore ?? fa.managerRating ?? fa.manager ?? null;
  const hrScore = fa.hrScore ?? fa.HrScore ?? null;
  const finalScore =
    fa.finalScore ?? fa.finalRating ?? fa.calibratedScore ?? fa.score ?? hrScore ?? null;
  const selfComment =
    fa.selfComment ??
    fa.selfComments ??
    fa.employeeComment ??
    fa.employeeFeedback ??
    fa.selfAssessmentComment ??
    fa.selfReview ??
    '';
  const managerComment =
    fa.managerComment ??
    fa.managerComments ??
    fa.feedback ??
    fa.comment ??
    '';
  const hrComment =
    fa.hrComment ?? fa.HrComment ?? fa.hrComments ?? '';

  const rowId =
    fa.sectionId ?? fa.focusAreaId ?? fa.id ?? `${name}-${selfScore}-${managerScore}`;

  const numOrNaN = (v) =>
    v == null || v === '' ? NaN : Number(v);

  const nSelf = numOrNaN(selfScore);
  const nMgr = numOrNaN(managerScore);
  const nHr = numOrNaN(hrScore);
  const nFin = numOrNaN(finalScore);
  const safe = Number.isFinite;

  return {
    rowId: String(rowId),
    name: String(name),
    selfScore: safe(nSelf) ? nSelf : 0,
    managerScore: safe(nMgr) ? nMgr : 0,
    /** Present when HR scored this focus area; otherwise null. */
    hrScore: safe(nHr) ? nHr : null,
    finalScore: safe(nFin) ? nFin : 0,
    selfComment: String(selfComment || ''),
    managerComment: String(managerComment || ''),
    hrComment: String(hrComment || ''),
  };
}

/**
 * Builds the detail view model for My Results charts/tables from a single-result API payload.
 */
export function normalizeMyResultDetailPayload(raw) {
  const e = toEntityFromPayload(raw);
  if (!e || typeof e !== 'object') return null;

  const assignmentId =
    e.assignmentId ??
    e.id ??
    e.reviewAssignmentId ??
    e.reviewId;

  const formName =
    e.formName ?? e.reviewFormName ?? e.formTitle ?? e.title ?? 'Performance review';

  /** Prefer FY label from API when present (e.g. "FY 2025-2026"). */
  const period =
    e.financialYear ??
    e.period ??
    e.fiscalYear ??
    e.appraisalCycleName ??
    '-';

  const ratingScale = Number(e.ratingScale ?? e.scale ?? e.maxRating ?? 5) || 5;

  const finiteOrNaN = (v) => {
    if (v == null || v === '') return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };

  const selfOverallNum = finiteOrNaN(e.selfOverallScore);
  const managerOverallNum = finiteOrNaN(e.managerOverallScore);
  const hrOverallNum = finiteOrNaN(e.hrOverallScore);

  const publishedDate =
    e.publishedDate ?? e.publishedAt ?? e.finalizedDate ?? e.completedAt ?? null;

  const managerName =
    e.managerName ?? e.reviewerName ?? e.reportingManagerName ?? '-';

  const hrName = e.hrName ?? e.hrRepresentativeName ?? e.hrContactName ?? 'HR Team';

  const hrCommentsRaw = e.hrComments ?? e.hrFeedback ?? e.hrRemark ?? e.executiveSummary;
  const hrComments =
    hrCommentsRaw != null && String(hrCommentsRaw).trim() !== ''
      ? String(hrCommentsRaw).trim()
      : '-';

  const focusSource =
    (Array.isArray(e.focusAreaResults) && e.focusAreaResults) ||
    (Array.isArray(e.focusAreas) && e.focusAreas) ||
    (Array.isArray(e.focusAreaScores) && e.focusAreaScores) ||
    (Array.isArray(e.scoresByFocusArea) && e.scoresByFocusArea) ||
    [];

  const focusAreas = focusSource.map(mapFocusAreaRow).filter(Boolean);

  const avgFinalFocus =
    focusAreas.length > 0
      ? focusAreas.reduce((a, fa) => a + fa.finalScore, 0) / focusAreas.length
      : NaN;

  /** Headline rating: HR calibration overall when HR phase is done; else explicit final*; else average final per focus area */
  const hrDone = ['completed', 'submitted'].includes(
    String(e.hrReviewStatus ?? '').trim().toLowerCase()
  );
  let finalRating;
  if (hrDone && Number.isFinite(hrOverallNum)) finalRating = hrOverallNum;
  else {
    const explicit = finiteOrNaN(
      e.finalRating ?? e.finalScore ?? e.overallRating ?? e.overallScore
    );
    finalRating = Number.isFinite(explicit) ? explicit : avgFinalFocus;
  }
  if (!Number.isFinite(finalRating)) finalRating = 0;

  if (assignmentId == null || assignmentId === '') return null;

  return {
    id: String(assignmentId),
    formName: String(formName),
    period: String(period),
    finalRating,
    ratingScale,
    publishedDate,
    managerName: String(managerName),
    hrName: String(hrName),
    hrComments,
    selfOverallScore: Number.isFinite(selfOverallNum) ? selfOverallNum : null,
    managerOverallScore: Number.isFinite(managerOverallNum) ? managerOverallNum : null,
    hrOverallScore: Number.isFinite(hrOverallNum) ? hrOverallNum : null,
    focusAreas,
  };
}
