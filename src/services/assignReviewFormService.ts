// @ts-nocheck
// APIs for assign-review-form flows (paged list + create assignments).

import api from './api';

/**
 * GET /performance/assignments — paged list. Optional query: financialYearId, reviewFormId.
 * Server returns PagedResult: { data, totalCount, page, pageSize } (camelCase or PascalCase).
 */
export function getAssignmentsPaged(params: {
  page: number;
  pageSize: number;
  financialYearId?: string;
  reviewFormId?: string;
}) {
  const { page, pageSize, financialYearId, reviewFormId } = params;
  return api.get('/performance/assignments', {
    params: {
      page,
      pageSize,
      ...(financialYearId !== undefined && financialYearId !== null && financialYearId !== ''
        ? { financialYearId }
        : {}),
      ...(reviewFormId !== undefined && reviewFormId !== null && reviewFormId !== ''
        ? { reviewFormId }
        : {}),
    },
  });
}

/**
 * GET /performance/assignments/employees — employees for a review form + financial year.
 * Query: financialYearId, reviewFormId, page, pageSize, search (optional).
 */
export function getAssignmentEmployeesPaged(params: {
  financialYearId: string;
  reviewFormId: string;
  page: number;
  pageSize: number;
  search?: string;
}) {
  const { financialYearId, reviewFormId, page, pageSize, search } = params;
  return api.get('/performance/assignments/employees', {
    params: {
      financialYearId,
      reviewFormId,
      page,
      pageSize,
      ...(search !== undefined && search !== null && String(search).trim() !== ''
        ? { search: String(search).trim() }
        : {}),
    },
  });
}

/**
 * GET /performance/assignments/employees/export — excel export (no pagination).
 * Query: financialYearId, reviewFormId, search (optional).
 *
 * Returns full Axios response (blob + headers) to read Content-Disposition filename.
 */
export function exportAssignmentEmployeesExcel(params: {
  financialYearId: string;
  reviewFormId: string;
  search?: string;
}) {
  const { financialYearId, reviewFormId, search } = params;
  return api.get('/performance/assignments/employees/export', {
    params: {
      financialYearId,
      reviewFormId,
      ...(search !== undefined && search !== null && String(search).trim() !== ''
        ? { search: String(search).trim() }
        : {}),
    },
    responseType: 'blob',
  });
}

/**
 * PATCH /performance/assignments/{assignmentId}/evaluation-windows — edit all 6 evaluation window dates.
 * Payload keys must be camelCase (ASP.NET Core default).
 */
export function patchAssignmentEvaluationWindows(
  assignmentId: string,
  data: {
    selfEvalStart: string | null;
    selfEvalEnd: string | null;
    managerEvalStart: string | null;
    managerEvalEnd: string | null;
    hrReviewStart: string | null;
    hrReviewEnd: string | null;
    reason?: string;
  }
) {
  return api.patch(`/performance/assignments/${encodeURIComponent(String(assignmentId))}/evaluation-windows`, data);
}

/**
 * PATCH /performance/timeline/extend — extend only one phase end date.
 * Frontend should always send assignmentId to avoid bulk updates.
 */
export function patchExtendAssignmentTimeline(data: {
  assignmentId: string;
  phase: string;
  newDate: string;
  reason?: string;
}) {
  return api.patch('/performance/timeline/extend', data);
}

/** POST /performance/assignments */
export function createAssignments(data) {
  return api.post('/performance/assignments', data);
}
