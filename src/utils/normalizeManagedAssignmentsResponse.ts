// @ts-nocheck
import { parseRatingScaleMax } from './helpers';

/** Max rating from nested `appraisalConfig` (GET /performance/managed-assignments). */
const ratingScaleFromAppraisalOn = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  const cfg = obj.appraisalConfig ?? obj.AppraisalConfig;
  if (cfg && typeof cfg === 'object') {
    const s = parseRatingScaleMax(cfg.ratingScale ?? cfg.RatingScale);
    if (s) return s;
  }
  return null;
};

const pickAppraisalRatingScale = (...candidates) => {
  for (const c of candidates) {
    if (!c || typeof c !== 'object') continue;
    const fromNested = ratingScaleFromAppraisalOn(c);
    if (fromNested) return fromNested;
    const flat = parseRatingScaleMax(c.appraisalRatingScale ?? c.AppraisalRatingScale);
    if (flat) return flat;
  }
  return null;
};

/** Parse paged API envelopes (matches operations assignments lists). */
export const readManagedAssignmentsPaged = (res) => {
  const inner = res?.data;
  const paged =
    inner &&
    typeof inner === 'object' &&
    !Array.isArray(inner) &&
    (Array.isArray(inner.data) ||
      Array.isArray(inner.Data) ||
      typeof inner.totalCount === 'number' ||
      typeof inner.TotalCount === 'number')
      ? inner
      : res &&
          typeof res === 'object' &&
          !Array.isArray(res) &&
          (Array.isArray(res.data) ||
            Array.isArray(res.Data) ||
            typeof res.totalCount === 'number' ||
            typeof res.TotalCount === 'number')
        ? res
        : {};

  const data = paged?.data ?? paged?.Data ?? [];
  const totalCount = Number(paged?.totalCount ?? paged?.TotalCount ?? 0) || 0;
  const page = Number(paged?.page ?? paged?.Page ?? 1) || 1;
  const pageSize = Number(paged?.pageSize ?? paged?.PageSize ?? 20) || 20;
  return { data, totalCount, page, pageSize };
};

const numOrNull = (v) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Normalize evaluation phase strings from API for comparison. */
const normEvaluationPhase = (p) => {
  let s = String(p ?? '').trim();
  s = s.replace(/([a-z])([A-Z])/g, '$1_$2');
  return s
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
};

/**
 * Reads `evaluations[].status` for the first evaluation whose phase matches any variant.
 * Used when assignment-level HR/manager snapshots are omitted but evaluations are present.
 */
const evalStatusForPhases = (evaluations, ...phaseVariants) => {
  if (!Array.isArray(evaluations) || evaluations.length === 0) return null;
  const targets = new Set(phaseVariants.map((v) => normEvaluationPhase(v)).filter(Boolean));
  if (targets.size === 0) return null;
  for (const ev of evaluations) {
    const ph = normEvaluationPhase(ev?.phase ?? ev?.Phase);
    if (!ph || !targets.has(ph)) continue;
    const st = ev?.status ?? ev?.Status;
    if (st != null && String(st).trim() !== '') return String(st).trim();
  }
  return null;
};

const mapManagedRowToTeamMember = (row) => {
  const emp = row?.employee ?? row?.Employee ?? {};
  const first = emp.firstName ?? emp.FirstName ?? row?.firstName ?? row?.FirstName ?? '';
  const last = emp.lastName ?? emp.LastName ?? row?.lastName ?? row?.LastName ?? '';
  const trimmedFull = `${first} ${last}`.trim();
  const name =
    row?.employeeName ??
    row?.EmployeeName ??
    (trimmedFull || null) ??
    emp.email ??
    row?.email ??
    row?.Email ??
    '-';

  const id =
    row?.employeeId ??
    row?.EmployeeId ??
    emp.id ??
    emp.Id ??
    emp.employeeId ??
    row?.id ??
    row?.Id;

  const mgrDetails =
    row?.managerDetails ??
    row?.ManagerDetails ??
    nestedA.managerDetails ??
    nestedA.ManagerDetails ??
    {};

  const nestedA = row?.assignment ?? row?.Assignment ?? {};

  return {
    id,
    name,
    designation:
      row?.designation ??
      row?.Designation ??
      emp.designation ??
      emp.Designation ??
      emp.jobTitle ??
      row?.jobTitle ??
      '',
    formName:
      row?.formName ??
      row?.reviewFormName ??
      row?.ReviewFormName ??
      row?.reviewForm?.name ??
      '',
    selfEmail: emp.email ?? emp.Email ?? row?.email ?? row?.Email ?? '',
    managerEmail:
      mgrDetails.email ??
      mgrDetails.Email ??
      row?.managerEmail ??
      row?.ManagerEmail ??
      '',
    selfEvalStatus: row?.selfEvalStatus ?? row?.SelfEvalStatus ?? 'Pending',
    managerReviewStatus:
      row?.managerReviewStatus ??
      row?.ManagerReviewStatus ??
      row?.managerEvalStatus ??
      row?.ManagerEvalStatus ??
      'Pending',
    hrReviewStatus:
      row?.hrReviewStatus ??
      row?.HrReviewStatus ??
      row?.hrEvalStatus ??
      row?.HrEvalStatus ??
      'Pending',
    selfOverallScore: numOrNull(
      row?.selfOverallScore ?? row?.SelfOverallScore ?? nestedA.selfOverallScore ?? nestedA.SelfOverallScore
    ),
    managerOverallScore: numOrNull(
      row?.managerOverallScore ??
        row?.ManagerOverallScore ??
        nestedA.managerOverallScore ??
        nestedA.ManagerOverallScore
    ),
    hrOverallScore: numOrNull(
      row?.hrOverallScore ?? row?.HrOverallScore ?? nestedA.hrOverallScore ?? nestedA.HrOverallScore
    ),
    overallRating: numOrNull(row?.overallRating ?? row?.OverallRating ?? nestedA.overallRating ?? nestedA.OverallRating),
    publishedStatus:
      row?.publishedStatus ??
      row?.PublishedStatus ??
      nestedA.publishedStatus ??
      nestedA.PublishedStatus ??
      null,
    publishedDate:
      row?.publishedDate ?? row?.PublishedDate ?? nestedA.publishedDate ?? nestedA.PublishedDate ?? null,
    reviewId:
      row?.reviewId ??
      row?.ReviewId ??
      row?.assignmentId ??
      row?.AssignmentId ??
      row?.id ??
      row?.Id,
    appraisalRatingScale: pickAppraisalRatingScale(row, nestedA),
  };
};

/**
 * New managed-assignments shape: `{ employee, assignments: [{ assignment, reviewForm, evaluations }] }`.
 */
const mapEmployeeAssignmentToTeamMember = (employee, bundle, parentWrapper) => {
  const emp = employee ?? {};
  const a = bundle?.assignment ?? bundle?.Assignment ?? {};
  const rf = bundle?.reviewForm ?? bundle?.ReviewForm ?? {};
  const evaluations = bundle?.evaluations ?? bundle?.Evaluations ?? [];

  const first = emp.firstName ?? emp.FirstName ?? '';
  const last = emp.lastName ?? emp.LastName ?? '';
  const trimmedFull = `${first} ${last}`.trim();
  const name =
    a.employeeName ??
    a.EmployeeName ??
    (trimmedFull || emp.email || emp.Email || '-');

  const id = emp.id ?? emp.Id ?? emp.employeeId ?? emp.EmployeeId ?? a.employeeId ?? a.EmployeeId;
  const mgrDetails =
    bundle?.managerDetails ??
    bundle?.ManagerDetails ??
    a.managerDetails ??
    a.ManagerDetails ??
    {};

  return {
    id,
    name,
    designation:
      a.designation ??
      a.Designation ??
      emp.designation ??
      emp.Designation ??
      '',
    formName:
      a.reviewFormName ??
      a.ReviewFormName ??
      rf.name ??
      rf.Name ??
      '',
    selfEmail: emp.email ?? emp.Email ?? '',
    managerEmail:
      mgrDetails.email ??
      mgrDetails.Email ??
      a.managerEmail ??
      a.ManagerEmail ??
      '',
    selfEvalStatus: a.selfEvalStatus ?? a.SelfEvalStatus ?? 'Pending',
    managerReviewStatus:
      a.managerEvalStatus ??
      a.ManagerEvalStatus ??
      'Pending',
    hrReviewStatus:
      a.hrReviewStatus ??
      a.HrReviewStatus ??
      a.hrEvalStatus ??
      a.HrEvalStatus ??
      evalStatusForPhases(evaluations, 'hr_review', 'hr_evaluation') ??
      'Pending',
    selfOverallScore: numOrNull(
      bundle?.selfOverallScore ?? bundle?.SelfOverallScore ?? a.selfOverallScore ?? a.SelfOverallScore
    ),
    managerOverallScore: numOrNull(
      bundle?.managerOverallScore ??
        bundle?.ManagerOverallScore ??
        a.managerOverallScore ??
        a.ManagerOverallScore
    ),
    hrOverallScore: numOrNull(
      bundle?.hrOverallScore ?? bundle?.HrOverallScore ?? a.hrOverallScore ?? a.HrOverallScore
    ),
    overallRating: numOrNull(bundle?.overallRating ?? bundle?.OverallRating ?? a.overallRating ?? a.OverallRating),
    publishedStatus:
      a.publishedStatus ??
      a.PublishedStatus ??
      bundle?.publishedStatus ??
      bundle?.PublishedStatus ??
      null,
    publishedDate:
      a.publishedDate ??
      a.PublishedDate ??
      bundle?.publishedDate ??
      bundle?.PublishedDate ??
      null,
    reviewId: a.id ?? a.Id ?? bundle?.assignmentId ?? bundle?.AssignmentId,
    appraisalRatingScale: pickAppraisalRatingScale(bundle, a, emp, parentWrapper),
  };
};

/** Flatten grouped employees + assignments, or preserve legacy flat rows */
const expandManagedAssignmentList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.flatMap((row) => {
    const assignments = row?.assignments ?? row?.Assignments;
    if (Array.isArray(assignments)) {
      const employee = row?.employee ?? row?.Employee ?? {};
      return assignments.map((bundle) =>
        bundle?.assignment != null || bundle?.Assignment != null
          ? mapEmployeeAssignmentToTeamMember(employee, bundle, row)
          : mapManagedRowToTeamMember(bundle)
      );
    }
    return [mapManagedRowToTeamMember(row)];
  });
};

/**
 * Normalizes GET /performance/managed-assignments into rows for the employee "Others' Reviews" table.
 */
export function normalizeManagedAssignmentsResponse(raw) {
  if (Array.isArray(raw)) {
    const rows = expandManagedAssignmentList(raw);
    return {
      rows,
      totalCount: rows.length,
      page: 1,
      pageSize: rows.length || 20,
    };
  }

  const p = readManagedAssignmentsPaged(raw);
  const list = Array.isArray(p.data) ? p.data : [];
  const rows = expandManagedAssignmentList(list);
  const totalCount = p.totalCount || rows.length;
  return {
    rows,
    totalCount,
    page: p.page,
    pageSize: p.pageSize,
  };
}
