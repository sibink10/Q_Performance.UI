// @ts-nocheck
// src/services/performanceService.js
// All API calls for the Performance module
// Organized by module section: Config → Operations → Employee → Manager

import api from './api';
import { createAssignments } from './assignReviewFormService';

const performanceService = {
  // ── Config: Appraisal Cycle Settings ───────────────────────────────────────
  getAppraisalConfig: (financialYearId) =>
    api.get('/performance/config', { params: { financialYearId } }),
  getAllAppraisalConfigs: () => api.get('/performance/config/all'),
  createAppraisalConfig: (data) => api.post('/performance/config', data),
  updateAppraisalConfig: (id, data) => api.put(`/performance/config/${id}`, data),
  deleteAppraisalConfig: (id) => api.delete(`/performance/config/${id}`),
  getFinancialYears: () => api.get('/performance/config/financial-years'),
  createFinancialYear: (data) => api.post('/performance/config/financial-years', data),
  updateFinancialYear: (id, data) => api.put(`/performance/config/financial-years/${id}`, data),
  deleteFinancialYear: (id) => api.delete(`/performance/config/financial-years/${id}`),

  // ── Config: Focus Areas ────────────────────────────────────────────────────
  getFocusAreas: (params = {}) => api.get('/performance/focus-areas', { params }),
  createFocusArea: (data) => api.post('/performance/focus-areas', data),
  updateFocusArea: (id, data) => api.put(`/performance/focus-areas/${id}`, data),
  deleteFocusArea: (id) => api.delete(`/performance/focus-areas/${id}`),

  // ── Config: Review Forms ───────────────────────────────────────────────────
  getReviewForms: () => api.get('/performance/review-forms'),
  getReviewFormById: (id) => api.get(`/performance/review-forms/${id}`),
  createReviewForm: (data) => api.post('/performance/review-forms', data),
  updateReviewForm: (id, data) => api.put(`/performance/review-forms/${id}`, data),
  deleteReviewForm: (id) => api.delete(`/performance/review-forms/${id}`),

  // ── Operations: Dashboard ──────────────────────────────────────────────────
  getDashboard: (financialYearId, reviewFormId) =>
    api.get('/performance/dashboard', {
      params: { financialYearId, reviewFormId },
    }),
  exportDashboard: (financialYearId, reviewFormId) =>
    api.get('/performance/dashboard/export', {
      params: { financialYearId, reviewFormId },
      responseType: 'blob',
    }),

  // ── Operations: Assign Review Forms ───────────────────────────────────────
  assignReviewForm: (data) => createAssignments(data),
  getAssignments: (params = {}) => api.get('/performance/assignments', { params }),
  getAssignmentById: (id) => api.get(`/performance/assignments/${id}`),
  publishReviewFormAssignments: ({ reviewFormId, financialYearId }) =>
    api.patch('/performance/assignments/review-form/publish', {}, {
      params: { reviewFormId, financialYearId },
    }),

  // ── Operations: Timeline Management ───────────────────────────────────────
  extendTimeline: (data) => api.patch('/performance/timeline/extend', data),
  getTimelineLog: (reviewId) => api.get(`/performance/timeline/log/${reviewId}`),

  // ── Operations: HR/Admin Actions ───────────────────────────────────────────
  /** Publish assignment results to the employee (per-assignment; requires submitted HR review with rating). */
  publishRatings: (assignmentId) =>
    api.patch(`/performance/assignments/${assignmentId}/publish`),
  unpublishAssignmentResults: (assignmentId) =>
    api.patch(`/performance/assignments/${assignmentId}/unpublish`),
  publishAssignmentsBulk: (assignmentIds) =>
    api.post('/performance/assignments/publish-bulk', { assignmentIds }),
  unpublishAssignmentsBulk: (assignmentIds) =>
    api.post('/performance/assignments/unpublish-bulk', { assignmentIds }),
  calibrateRating: (evaluationId, data) =>
    api.patch(`/performance/evaluations/${evaluationId}/calibrate`, data),
  normalizeRatings: (assignmentId, rules) =>
    api.post(`/performance/assignments/${assignmentId}/normalize`, rules),

  // ── Employee: My Reviews ───────────────────────────────────────────────────
  getMyReviews: (financialYearId) =>
    api.get('/performance/my-reviews', {
      params: { ...(financialYearId ? { financialYearId } : {}) },
    }),
  getMyPublishedReviews: (financialYearId) =>
    api.get('/performance/my-reviews/published', {
      params: { ...(financialYearId ? { financialYearId } : {}) },
    }),
  saveDraft: (reviewId, body) =>
    api.patch(`/performance/my-reviews/${reviewId}/draft`, body),
  submitSelfEvaluation: (reviewId, body) =>
    api.post(`/performance/my-reviews/${reviewId}/submit`, body),

  // ── Employee: My Results ───────────────────────────────────────────────────
  getMyResults: (financialYearId) =>
    api.get('/performance/my-results', {
      params: { ...(financialYearId ? { financialYearId } : {}) },
    }),
  /** GET /performance/my-results/:assignmentId — published result detail for current user */
  getMyResultByAssignmentId: (assignmentId) =>
    api.get(`/performance/my-results/${assignmentId}`),

  // ── Manager: Team Reviews (managed assignments for current manager) ─────────
  getManagedAssignments: (params = {}) => api.get('/performance/managed-assignments', { params }),
  getEmployeeSelfEvaluation: (employeeId, reviewId) =>
    api.get(`/performance/manager/team/${employeeId}/review/${reviewId}`),
  submitManagerEvaluation: (employeeId, reviewId, body) =>
    api.post(`/performance/manager/team/${employeeId}/review/${reviewId}/submit`, body),
  submitHrReview: (assignmentId, body) =>
    api.post(`/performance/assignments/${assignmentId}/hr-review/submit`, body),
};

export default performanceService;
