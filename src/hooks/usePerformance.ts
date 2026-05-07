// @ts-nocheck
// src/hooks/usePerformance.js
// Custom hook centralizing all performance state and dispatch actions

import { useDispatch, useSelector } from 'react-redux';
import {
  selectAppraisalConfig,
  selectFocusAreas,
  selectFocusAreasPagination,
  selectActiveFocusAreas,
  selectReviewForms,
  selectDashboardEmployees,
  selectDashboardFilters,
  selectMyReviews,
  selectMyReviewsLoading,
  selectMyPublishedReviews,
  selectMyPublishedReviewsLoading,
  selectMyResults,
  selectMyResultDetail,
  selectMyResultDetailLoading,
  selectManagerTeam,
  selectManagerTeamTotalCount,
  selectManagerTeamLoading,
  selectActiveEvaluation,
  selectPerfLoading,
  selectPerfSaving,
  selectPerfError,
  selectPerfSuccess,
  setDashboardFilter,
  setActiveEvaluation,
  updateEvaluationAnswer,
  clearError,
  clearSuccessMessage,
  clearMyResultDetail,
} from '../app/state/slices/performanceSlice';

import {
  fetchAppraisalConfig,
  saveAppraisalConfig,
  fetchFocusAreas,
  saveFocusArea,
  updateFocusArea,
  fetchReviewForms,
  saveReviewForm,
  updateReviewForm,
  deleteReviewForm as deleteReviewFormThunk,
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
} from '../app/state/slices/performanceThunks';

const usePerformance = () => {
  const dispatch = useDispatch();

  return {
    // ── State ──────────────────────────────────────────────────────────────
    appraisalConfig: useSelector(selectAppraisalConfig),
    focusAreas: useSelector(selectFocusAreas),
    focusAreasPagination: useSelector(selectFocusAreasPagination),
    activeFocusAreas: useSelector(selectActiveFocusAreas),
    reviewForms: useSelector(selectReviewForms),
    dashboardEmployees: useSelector(selectDashboardEmployees),
    dashboardFilters: useSelector(selectDashboardFilters),
    myReviews: useSelector(selectMyReviews),
    myReviewsLoading: useSelector(selectMyReviewsLoading),
    myPublishedReviews: useSelector(selectMyPublishedReviews),
    myPublishedReviewsLoading: useSelector(selectMyPublishedReviewsLoading),
    myResults: useSelector(selectMyResults),
    myResultDetail: useSelector(selectMyResultDetail),
    myResultDetailLoading: useSelector(selectMyResultDetailLoading),
    managerTeam: useSelector(selectManagerTeam),
    managerTeamTotalCount: useSelector(selectManagerTeamTotalCount),
    managerTeamLoading: useSelector(selectManagerTeamLoading),
    activeEvaluation: useSelector(selectActiveEvaluation),
    isLoading: useSelector(selectPerfLoading),
    isSaving: useSelector(selectPerfSaving),
    error: useSelector(selectPerfError),
    successMessage: useSelector(selectPerfSuccess),

    // ── Config Actions ─────────────────────────────────────────────────────
    loadAppraisalConfig: (financialYearId) => dispatch(fetchAppraisalConfig(financialYearId)),
    updateConfig: (data) => dispatch(saveAppraisalConfig(data)),
    loadFocusAreas: (params = {}) => dispatch(fetchFocusAreas(params)),
    addFocusArea: (data) => dispatch(saveFocusArea(data)),
    editFocusArea: (id, data) => dispatch(updateFocusArea({ id, data })),
    loadReviewForms: () => dispatch(fetchReviewForms()),
    createReviewForm: (data) => dispatch(saveReviewForm(data)),
    editReviewForm: (id, data) => dispatch(updateReviewForm({ id, data })),
    deleteReviewForm: (id) => dispatch(deleteReviewFormThunk(id)),
    publishReviewForm: (reviewFormId, financialYearId) =>
      dispatch(publishReviewFormAssignments({ reviewFormId, financialYearId })),

    // ── Operations Actions ─────────────────────────────────────────────────
    loadDashboard: (financialYearId, formId) =>
      dispatch(fetchPerformanceDashboard({ financialYearId, reviewFormId: formId })),
    setFilter: (filter) => dispatch(setDashboardFilter(filter)),
    assignForm: (data) => dispatch(assignReviewForm(data)),
    extendDeadline: (data) => dispatch(extendTimeline(data)),

    // ── Employee Actions ───────────────────────────────────────────────────
    loadMyReviews: (financialYearId) => dispatch(fetchMyReviews(financialYearId)),
    loadMyPublishedReviews: (financialYearId) => dispatch(fetchMyPublishedReviews(financialYearId)),
    setCurrentEvaluation: (ev) => dispatch(setActiveEvaluation(ev)),
    updateAnswer: (data) => dispatch(updateEvaluationAnswer(data)),
    saveDraft: (reviewId, answers) => dispatch(saveEvaluation({ reviewId, answers })),
    submitSelfEval: (reviewId, answers) => dispatch(submitEvaluation({ reviewId, answers })),
    loadMyResults: (year) => dispatch(fetchMyResults(year)),
    loadMyResultDetail: (assignmentId) => dispatch(fetchMyResultDetail(assignmentId)),
    resetMyResultDetail: () => dispatch(clearMyResultDetail()),

    // ── Manager Actions ────────────────────────────────────────────────────
    loadManagerTeam: (arg) => dispatch(fetchManagerTeam(arg)),
    submitManagerEval: (data) => dispatch(submitManagerEvaluation(data)),
    submitHrEval: (assignmentId, hrOverallRating, hrComments) =>
      dispatch(submitHrReview({ assignmentId, hrOverallRating, hrComments })),

    // ── UI Actions ─────────────────────────────────────────────────────────
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccessMessage()),
  };
};

export default usePerformance;
