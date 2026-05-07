// @ts-nocheck
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
    '—';

  const id =
    row?.employeeId ??
    row?.EmployeeId ??
    emp.id ??
    emp.Id ??
    emp.employeeId ??
    row?.id ??
    row?.Id;

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
    reviewId:
      row?.reviewId ??
      row?.ReviewId ??
      row?.assignmentId ??
      row?.AssignmentId ??
      row?.id ??
      row?.Id,
  };
};

/**
 * New managed-assignments shape: `{ employee, assignments: [{ assignment, reviewForm, evaluations }] }`.
 */
const mapEmployeeAssignmentToTeamMember = (employee, bundle) => {
  const emp = employee ?? {};
  const a = bundle?.assignment ?? bundle?.Assignment ?? {};
  const rf = bundle?.reviewForm ?? bundle?.ReviewForm ?? {};

  const first = emp.firstName ?? emp.FirstName ?? '';
  const last = emp.lastName ?? emp.LastName ?? '';
  const trimmedFull = `${first} ${last}`.trim();
  const name =
    a.employeeName ??
    a.EmployeeName ??
    (trimmedFull || emp.email || emp.Email || '—');

  const id = emp.id ?? emp.Id ?? emp.employeeId ?? emp.EmployeeId ?? a.employeeId ?? a.EmployeeId;

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
      'Pending',
    reviewId: a.id ?? a.Id ?? bundle?.assignmentId ?? bundle?.AssignmentId,
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
          ? mapEmployeeAssignmentToTeamMember(employee, bundle)
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
