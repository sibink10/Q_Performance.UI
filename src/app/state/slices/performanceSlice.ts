// @ts-nocheck
// src/app/state/slices/performanceSlice.js
// Manages all performance-related state:
//   - Appraisal cycle config
//   - Focus areas
//   - Review forms
//   - Assignments
//   - Evaluations
//   - Results

import { createSlice } from '@reduxjs/toolkit';
import {
  fetchAppraisalConfig,
  saveAppraisalConfig,
  fetchFocusAreas,
  saveFocusArea,
  updateFocusArea,
  fetchReviewForms,
  saveReviewForm,
  updateReviewForm,
  deleteReviewForm,
  publishReviewFormAssignments,
  fetchPerformanceDashboard,
  assignReviewForm,
  fetchMyReviews,
  fetchMyPublishedReviews,
  saveEvaluation,
  submitEvaluation,
  fetchMyResults,
  fetchMyResultDetail,
  fetchManagerTeam,
  submitManagerEvaluation,
  submitHrReview,
  extendTimeline,
} from './performanceThunks';
import { toArrayFromPayload } from '../../../utils';
const getEntityId = (item) => item?.id ?? item?._id;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  // Config
  appraisalConfig: null,
  focusAreas: [],
  /** Present when the last focus-areas list response included pagination metadata. */
  focusAreasPagination: null,
  reviewForms: [],

  // Operations
  dashboard: {
    employees: [],
    filters: { financialYearId: '', reviewFormId: '' },
  },

  // Employee module
  myReviews: {
    pending: [],
    submitted: [],
  },
  myReviewsLoading: false,
  /** GET /performance/my-reviews/published - isolated from `myReviews` so lists do not overwrite each other */
  myPublishedReviews: {
    pending: [],
    submitted: [],
  },
  myPublishedReviewsLoading: false,
  myResults: [],
  /** GET /performance/my-results/:assignmentId */
  myResultDetail: null,
  myResultDetailLoading: false,

  // Manager module (GET /performance/managed-assignments)
  managerTeam: [],
  managerTeamTotalCount: 0,
  managerTeamLoading: false,

  // Active form being filled
  activeEvaluation: null,

  // UI state
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    setDashboardFilter: (state, action) => {
      state.dashboard.filters = { ...state.dashboard.filters, ...action.payload };
    },
    setActiveEvaluation: (state, action) => {
      state.activeEvaluation = action.payload;
    },
    updateEvaluationAnswer: (state, action) => {
      const { questionId, rating, comment } = action.payload;
      if (state.activeEvaluation) {
        const answers = state.activeEvaluation.answers || {};
        answers[questionId] = { rating, comment };
        state.activeEvaluation.answers = answers;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearMyResultDetail: (state) => {
      state.myResultDetail = null;
      state.myResultDetailLoading = false;
    },
  },
  extraReducers: (builder) => {
    // ── Helper to handle loading states ──────────────────────────────────────
    const handlePending = (state) => { state.isLoading = true; state.error = null; };
    const handleSavePending = (state) => { state.isSaving = true; state.error = null; };
    const handleRejected = (state, action) => {
      state.isLoading = false;
      state.isSaving = false;
      const p = action.payload;
      state.error =
        p != null &&
        typeof p === 'object' &&
        !Array.isArray(p) &&
        typeof p.message === 'string'
          ? p.message
          : (typeof p === 'string' ? p : null) || 'Something went wrong';
    };

    // ── Appraisal Config ─────────────────────────────────────────────────────
    builder
      .addCase(fetchAppraisalConfig.pending, (state) => {
        handlePending(state);
        state.successMessage = null;
      })
      .addCase(fetchAppraisalConfig.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.appraisalConfig = payload;
      })
      .addCase(fetchAppraisalConfig.rejected, handleRejected);

    builder
      .addCase(saveAppraisalConfig.pending, handleSavePending)
      .addCase(saveAppraisalConfig.fulfilled, (state, { payload }) => {
        state.isSaving = false;
        state.appraisalConfig = payload;
        state.successMessage = 'Appraisal configuration saved successfully';
      })
      .addCase(saveAppraisalConfig.rejected, handleRejected);

    // ── Focus Areas ──────────────────────────────────────────────────────────
    builder
      .addCase(fetchFocusAreas.pending, handlePending)
      .addCase(fetchFocusAreas.fulfilled, (state, { payload, meta }) => {
        state.isLoading = false;
        const items = toArrayFromPayload(payload);
        const d = payload?.data;
        const paged =
          d &&
          typeof d === 'object' &&
          !Array.isArray(d) &&
          Array.isArray(d.data) &&
          'totalCount' in d;

        state.focusAreasPagination = paged
          ? {
              totalCount: Number(d.totalCount) || 0,
              page: Number(d.page) || 1,
              pageSize: Number(d.pageSize) || 20,
              totalPages: Number(d.totalPages) || 0,
            }
          : null;

        const append =
          meta?.arg && typeof meta.arg === 'object' && meta.arg.append === true;

        if (append) {
          const byId = new Map([...state.focusAreas].map((f) => [f.id, f]));
          items.forEach((f) => {
            if (f?.id != null) byId.set(f.id, f);
          });
          state.focusAreas = Array.from(byId.values());
        } else {
          state.focusAreas = items;
        }
      })
      .addCase(fetchFocusAreas.rejected, handleRejected);

    builder
      .addCase(saveFocusArea.pending, handleSavePending)
      .addCase(saveFocusArea.rejected, handleRejected)
      .addCase(saveFocusArea.fulfilled, (state, { payload }) => {
        state.isSaving = false;
        if (!Array.isArray(state.focusAreas)) {
          state.focusAreas = [];
        }
        state.focusAreas.push(payload);
        state.successMessage = 'Focus area added successfully';
      });

    builder
      .addCase(updateFocusArea.pending, handleSavePending)
      .addCase(updateFocusArea.rejected, handleRejected)
      .addCase(updateFocusArea.fulfilled, (state, { payload }) => {
        state.isSaving = false;
        if (!Array.isArray(state.focusAreas)) {
          state.focusAreas = [];
        }
        const idx = state.focusAreas.findIndex((f) => f.id === payload.id);
        if (idx !== -1) state.focusAreas[idx] = payload;
        state.successMessage = 'Focus area updated successfully';
      });

    // ── Review Forms ─────────────────────────────────────────────────────────
    builder
      .addCase(fetchReviewForms.pending, handlePending)
      .addCase(fetchReviewForms.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.reviewForms = toArrayFromPayload(payload);
      })
      .addCase(fetchReviewForms.rejected, handleRejected);

    builder
      .addCase(saveReviewForm.pending, handleSavePending)
      .addCase(saveReviewForm.rejected, handleRejected);

    builder
      .addCase(updateReviewForm.pending, handleSavePending)
      .addCase(updateReviewForm.rejected, handleRejected);

    builder.addCase(saveReviewForm.fulfilled, (state, { payload }) => {
      state.isSaving = false;
      if (!Array.isArray(state.reviewForms)) {
        state.reviewForms = [];
      }
      state.reviewForms.push(payload);
      state.successMessage = 'Review form saved successfully';
    });

    builder.addCase(updateReviewForm.fulfilled, (state, { payload }) => {
      state.isSaving = false;
      if (!Array.isArray(state.reviewForms)) {
        state.reviewForms = [];
      }
      const payloadId = getEntityId(payload);
      const idx = state.reviewForms.findIndex((f) => getEntityId(f) === payloadId);
      if (idx !== -1) {
        state.reviewForms[idx] = payload;
      }
      state.successMessage = 'Review form updated successfully';
    });

    builder
      .addCase(deleteReviewForm.pending, handleSavePending)
      .addCase(deleteReviewForm.rejected, handleRejected)
      .addCase(deleteReviewForm.fulfilled, (state, { payload, meta }) => {
        state.isSaving = false;
        if (!Array.isArray(state.reviewForms)) {
          state.reviewForms = [];
        }
        const deletedId = getEntityId(payload) ?? meta?.arg;
        state.reviewForms = state.reviewForms.filter((f) => getEntityId(f) !== deletedId);
        state.successMessage = 'Review form deleted successfully';
      });

    builder
      .addCase(publishReviewFormAssignments.pending, handleSavePending)
      .addCase(publishReviewFormAssignments.rejected, handleRejected)
      .addCase(publishReviewFormAssignments.fulfilled, (state) => {
        state.isSaving = false;
        state.successMessage = 'Review form published successfully';
      });

    // ── Operations Dashboard ─────────────────────────────────────────────────
    builder
      .addCase(fetchPerformanceDashboard.pending, handlePending)
      .addCase(fetchPerformanceDashboard.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.dashboard.employees = payload;
      })
      .addCase(fetchPerformanceDashboard.rejected, handleRejected);

    builder
      .addCase(assignReviewForm.pending, handleSavePending)
      .addCase(assignReviewForm.rejected, handleRejected)
      .addCase(assignReviewForm.fulfilled, (state) => {
        state.isSaving = false;
        state.successMessage = 'Review form assigned successfully. Employees have been notified.';
      });

    // ── Employee Reviews (dedicated flags: parallel manager fetch + no global isLoading races)
    builder
      .addCase(fetchMyReviews.pending, (state) => {
        state.myReviewsLoading = true;
        state.error = null;
        // Keep existing lists to prevent UI flicker while refreshing (e.g. financial year change).
      })
      .addCase(fetchMyReviews.fulfilled, (state, { payload }) => {
        state.myReviewsLoading = false;
        state.myReviews = payload;
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.myReviewsLoading = false;
        state.error = action.payload || 'Something went wrong';
      });
    builder
      .addCase(fetchMyPublishedReviews.pending, (state) => {
        state.myPublishedReviewsLoading = true;
        state.error = null;
        // Keep existing lists to prevent UI flicker while refreshing.
      })
      .addCase(fetchMyPublishedReviews.fulfilled, (state, { payload }) => {
        state.myPublishedReviewsLoading = false;
        state.myPublishedReviews = payload;
      })
      .addCase(fetchMyPublishedReviews.rejected, (state, action) => {
        state.myPublishedReviewsLoading = false;
        state.error = action.payload || 'Something went wrong';
      });

    builder
      .addCase(saveEvaluation.pending, handleSavePending)
      .addCase(saveEvaluation.rejected, handleRejected)
      .addCase(saveEvaluation.fulfilled, (state) => {
        state.isSaving = false;
        state.successMessage = 'Draft saved successfully';
      });

    builder
      .addCase(submitEvaluation.pending, handleSavePending)
      .addCase(submitEvaluation.rejected, handleRejected)
      .addCase(submitEvaluation.fulfilled, (state, { payload }) => {
        state.isSaving = false;
        // Move from pending to submitted
        state.myReviews.pending = state.myReviews.pending.filter(
          (r) => r.id !== payload.id
        );
        state.myReviews.submitted.push(payload);
        state.successMessage = 'Self-evaluation submitted successfully';
      });

    // ── My Results ───────────────────────────────────────────────────────────
    builder
      .addCase(fetchMyResults.pending, handlePending)
      .addCase(fetchMyResults.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.myResults = payload;
      })
      .addCase(fetchMyResults.rejected, handleRejected);

    builder
      .addCase(fetchMyResultDetail.pending, (state) => {
        state.myResultDetailLoading = true;
        state.myResultDetail = null;
        state.error = null;
      })
      .addCase(fetchMyResultDetail.fulfilled, (state, { payload }) => {
        state.myResultDetailLoading = false;
        state.myResultDetail = payload;
      })
      .addCase(fetchMyResultDetail.rejected, (state, action) => {
        state.myResultDetailLoading = false;
        state.myResultDetail = null;
        const p = action.payload;
        state.error =
          p != null &&
          typeof p === 'object' &&
          !Array.isArray(p) &&
          typeof p.message === 'string'
            ? p.message
            : (typeof p === 'string' ? p : null) || 'Something went wrong';
      });

    // ── Manager Team ─────────────────────────────────────────────────────────
    builder
      .addCase(fetchManagerTeam.pending, (state) => {
        state.managerTeamLoading = true;
      })
      .addCase(fetchManagerTeam.fulfilled, (state, { payload }) => {
        state.managerTeamLoading = false;
        state.managerTeam = payload.rows || [];
        state.managerTeamTotalCount =
          typeof payload.totalCount === 'number' ? payload.totalCount : (payload.rows || []).length;
      })
      .addCase(fetchManagerTeam.rejected, (state, action) => {
        state.managerTeamLoading = false;
        state.error = action.payload || state.error || 'Something went wrong';
      });

    builder
      .addCase(submitManagerEvaluation.pending, handleSavePending)
      .addCase(submitManagerEvaluation.rejected, handleRejected)
      .addCase(submitManagerEvaluation.fulfilled, (state, { payload, meta }) => {
        state.isSaving = false;
        const empId = payload?.employeeId ?? meta?.arg?.employeeId;
        if (empId != null) {
          const idx = state.managerTeam.findIndex((e) => String(e.id) === String(empId));
          if (idx !== -1) state.managerTeam[idx].managerReviewStatus = 'Submitted';
        }
        state.successMessage = 'Manager evaluation submitted successfully';
      });

    builder
      .addCase(submitHrReview.pending, handleSavePending)
      .addCase(submitHrReview.rejected, handleRejected)
      .addCase(submitHrReview.fulfilled, (state, { meta }) => {
        state.isSaving = false;
        const assignmentId = meta?.arg?.assignmentId;
        if (assignmentId != null) {
          const idx = state.managerTeam.findIndex((e) => String(e.reviewId) === String(assignmentId));
          if (idx !== -1) state.managerTeam[idx].hrReviewStatus = 'Submitted';
        }
        state.successMessage = 'HR review submitted successfully';
      });

    // ── Timeline Extension ───────────────────────────────────────────────────
    builder
      .addCase(extendTimeline.pending, handleSavePending)
      .addCase(extendTimeline.rejected, handleRejected)
      .addCase(extendTimeline.fulfilled, (state) => {
        state.isSaving = false;
        state.successMessage = 'Timeline extended and changes logged';
      });
  },
});

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAppraisalConfig = (state) => state.performance.appraisalConfig;
export const selectFocusAreas = (state) =>
  Array.isArray(state.performance.focusAreas) ? state.performance.focusAreas : [];
export const selectFocusAreasPagination = (state) => state.performance.focusAreasPagination;
export const selectActiveFocusAreas = (state) =>
  (Array.isArray(state.performance.focusAreas) ? state.performance.focusAreas : []).filter(
    (f) => f.status === 'Active'
  );
export const selectReviewForms = (state) =>
  Array.isArray(state.performance.reviewForms) ? state.performance.reviewForms : [];
export const selectDashboardEmployees = (state) => state.performance.dashboard.employees;
export const selectDashboardFilters = (state) => state.performance.dashboard.filters;
export const selectMyReviews = (state) => state.performance.myReviews;
export const selectMyReviewsLoading = (state) => state.performance.myReviewsLoading;
export const selectMyPublishedReviews = (state) => state.performance.myPublishedReviews;
export const selectMyPublishedReviewsLoading = (state) => state.performance.myPublishedReviewsLoading;
export const selectMyResults = (state) => state.performance.myResults;
export const selectMyResultDetail = (state) => state.performance.myResultDetail;
export const selectMyResultDetailLoading = (state) => state.performance.myResultDetailLoading;
export const selectManagerTeam = (state) => state.performance.managerTeam;
export const selectManagerTeamTotalCount = (state) => state.performance.managerTeamTotalCount;
export const selectManagerTeamLoading = (state) => state.performance.managerTeamLoading;
export const selectActiveEvaluation = (state) => state.performance.activeEvaluation;
export const selectPerfLoading = (state) => state.performance.isLoading;
export const selectPerfSaving = (state) => state.performance.isSaving;
export const selectPerfError = (state) => state.performance.error;
export const selectPerfSuccess = (state) => state.performance.successMessage;

export const {
  setDashboardFilter,
  setActiveEvaluation,
  updateEvaluationAnswer,
  clearError,
  clearSuccessMessage,
  clearMyResultDetail,
} = performanceSlice.actions;

export default performanceSlice.reducer;
