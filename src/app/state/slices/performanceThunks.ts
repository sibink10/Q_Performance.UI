// @ts-nocheck
// src/app/state/slices/performanceThunks.js
// All async API thunks for the Performance module
// Each thunk maps to a specific backend endpoint

import { createAsyncThunk } from '@reduxjs/toolkit';
import performanceService from '../../../services/performanceService';
import {
  toEntityFromPayload,
  serializeReviewFormForApi,
  getApiErrorMessage,
} from '../../../utils/helpers';
import {
  buildHrSubmitPayload,
  buildSelfOrManagerSubmitPayload,
} from '../../../utils/performanceSubmission';

/** Structured error for mutations so UI can handle 403/409. */
const rejectMutation = (e, rejectWithValue) =>
  rejectWithValue({
    message: getApiErrorMessage(e),
    status: e?.response?.status,
  });
import { normalizeMyReviewsResponse } from '../../../utils/normalizeMyReviewsResponse';
import { normalizeManagedAssignmentsResponse } from '../../../utils/normalizeManagedAssignmentsResponse';
import {
  normalizeMyResultsListPayload,
  normalizeMyResultDetailPayload,
} from '../../../utils/normalizeMyResultsResponse';

// ─── Config Module Thunks ─────────────────────────────────────────────────────

export const fetchAppraisalConfig = createAsyncThunk(
  'performance/fetchAppraisalConfig',
  async (financialYearId, { rejectWithValue }) => {
    try {
      const res = await performanceService.getAppraisalConfig(financialYearId);
      return toEntityFromPayload(res);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const saveAppraisalConfig = createAsyncThunk(
  'performance/saveAppraisalConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const res = await performanceService.updateAppraisalConfig(configData);
      return toEntityFromPayload(res);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const fetchFocusAreas = createAsyncThunk(
  'performance/fetchFocusAreas',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query =
        params && typeof params === 'object' ? { ...params } : {};
      delete query.append;
      return await performanceService.getFocusAreas(query);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const saveFocusArea = createAsyncThunk(
  'performance/saveFocusArea',
  async (data, { rejectWithValue }) => {
    try {
      return await performanceService.createFocusArea(data);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const updateFocusArea = createAsyncThunk(
  'performance/updateFocusArea',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await performanceService.updateFocusArea(id, data);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const fetchReviewForms = createAsyncThunk(
  'performance/fetchReviewForms',
  async (_, { rejectWithValue }) => {
    try {
      return await performanceService.getReviewForms();
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const saveReviewForm = createAsyncThunk(
  'performance/saveReviewForm',
  async (formData, { rejectWithValue }) => {
    try {
      const payload = serializeReviewFormForApi(formData);
      const res = await performanceService.createReviewForm(payload);
      return toEntityFromPayload(res);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const updateReviewForm = createAsyncThunk(
  'performance/updateReviewForm',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const payload = serializeReviewFormForApi(data);
      const res = await performanceService.updateReviewForm(id, payload);
      return toEntityFromPayload(res);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const deleteReviewForm = createAsyncThunk(
  'performance/deleteReviewForm',
  async (id, { rejectWithValue }) => {
    try {
      return await performanceService.deleteReviewForm(id);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const publishReviewFormAssignments = createAsyncThunk(
  'performance/publishReviewFormAssignments',
  async ({ reviewFormId, financialYearId }, { rejectWithValue }) => {
    try {
      return await performanceService.publishReviewFormAssignments({
        reviewFormId,
        financialYearId,
      });
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

// ─── Operations Module Thunks ─────────────────────────────────────────────────

export const fetchPerformanceDashboard = createAsyncThunk(
  'performance/fetchDashboard',
  async ({ financialYearId, reviewFormId }, { rejectWithValue }) => {
    try {
      return await performanceService.getDashboard(financialYearId, reviewFormId);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const assignReviewForm = createAsyncThunk(
  'performance/assignReviewForm',
  async (assignmentData, { rejectWithValue }) => {
    try {
      return await performanceService.assignReviewForm(assignmentData);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const extendTimeline = createAsyncThunk(
  'performance/extendTimeline',
  async ({ employeeId, phase, newDate }, { rejectWithValue }) => {
    try {
      return await performanceService.extendTimeline({ employeeId, phase, newDate });
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

// ─── Employee Module Thunks ───────────────────────────────────────────────────

export const fetchMyReviews = createAsyncThunk(
  'performance/fetchMyReviews',
  async (financialYearId, { rejectWithValue }) => {
    try {
      const data = await performanceService.getMyReviews(financialYearId);
      return normalizeMyReviewsResponse(data);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const fetchMyPublishedReviews = createAsyncThunk(
  'performance/fetchMyPublishedReviews',
  async (financialYearId, { rejectWithValue }) => {
    try {
      const data = await performanceService.getMyPublishedReviews(financialYearId);
      return normalizeMyReviewsResponse(data);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const saveEvaluation = createAsyncThunk(
  'performance/saveEvaluation',
  async ({ reviewId, answers }, { rejectWithValue }) => {
    try {
      const payload = buildSelfOrManagerSubmitPayload(answers);
      return await performanceService.saveDraft(reviewId, payload);
    } catch (e) {
      return rejectMutation(e, rejectWithValue);
    }
  }
);

export const submitEvaluation = createAsyncThunk(
  'performance/submitEvaluation',
  async ({ reviewId, answers }, { rejectWithValue }) => {
    try {
      const payload = buildSelfOrManagerSubmitPayload(answers);
      return await performanceService.submitSelfEvaluation(reviewId, payload);
    } catch (e) {
      return rejectMutation(e, rejectWithValue);
    }
  }
);

export const fetchMyResults = createAsyncThunk(
  'performance/fetchMyResults',
  async (financialYear, { rejectWithValue }) => {
    try {
      const data = await performanceService.getMyResults(financialYear);
      return normalizeMyResultsListPayload(data);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const fetchMyResultDetail = createAsyncThunk(
  'performance/fetchMyResultDetail',
  async (assignmentId, { rejectWithValue }) => {
    try {
      const data = await performanceService.getMyResultByAssignmentId(assignmentId);
      const normalized = normalizeMyResultDetailPayload(data);
      if (!normalized) {
        return rejectWithValue('Result could not be loaded');
      }
      return normalized;
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

// ─── Manager Module Thunks ────────────────────────────────────────────────────

/**
 * Loads manager's direct-report review rows from GET /performance/managed-assignments.
 * @param arg Financial year id string, or `{ financialYearId, page?, pageSize?, search?, reviewFormId? }`.
 */
export const fetchManagerTeam = createAsyncThunk(
  'performance/fetchManagerTeam',
  async (arg, { rejectWithValue }) => {
    try {
      const params =
        typeof arg === 'string'
          ? { financialYearId: arg, page: 1, pageSize: 20, search: '' }
          : {
              financialYearId: arg.financialYearId,
              page: arg.page ?? 1,
              pageSize: arg.pageSize ?? 20,
              search: arg.search ?? '',
              ...(arg.reviewFormId != null && String(arg.reviewFormId).trim() !== ''
                ? { reviewFormId: arg.reviewFormId }
                : {}),
            };
      const raw = await performanceService.getManagedAssignments(params);
      return normalizeManagedAssignmentsResponse(raw);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  }
);

export const submitManagerEvaluation = createAsyncThunk(
  'performance/submitManagerEvaluation',
  async ({ employeeId, reviewId, answers }, { rejectWithValue }) => {
    try {
      const payload = buildSelfOrManagerSubmitPayload(answers);
      return await performanceService.submitManagerEvaluation(employeeId, reviewId, payload);
    } catch (e) {
      return rejectMutation(e, rejectWithValue);
    }
  }
);

export const submitHrReview = createAsyncThunk(
  'performance/submitHrReview',
  async ({ assignmentId, hrOverallRating, hrComments }, { rejectWithValue }) => {
    try {
      const payload = buildHrSubmitPayload({ hrOverallRating, hrComments });
      return await performanceService.submitHrReview(assignmentId, payload);
    } catch (e) {
      return rejectMutation(e, rejectWithValue);
    }
  }
);
