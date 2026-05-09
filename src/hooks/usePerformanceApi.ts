// @ts-nocheck
import performanceService from '../services/performanceService';
import { getApiErrorMessage, toEntityFromPayload } from '../utils/helpers';
import { buildSelfOrManagerSubmitPayload } from '../utils/performanceSubmission';

/**
 * Thin hook wrapper around `performanceService` so components don't call API services directly.
 * This is intentionally NOT Redux/thunk-backed for one-off reads / actions that don't need global caching.
 */
const usePerformanceApi = () => {
  const getReviewFormById = async (id) => {
    try {
      const res = await performanceService.getReviewFormById(id);
      return toEntityFromPayload(res);
    } catch (e) {
      throw new Error(getApiErrorMessage(e));
    }
  };

  const getAssignmentById = async (id) => {
    try {
      const res = await performanceService.getAssignmentById(id);
      return toEntityFromPayload(res);
    } catch (e) {
      throw new Error(getApiErrorMessage(e));
    }
  };

  const publishRatings = async (assignmentId) => {
    try {
      return await performanceService.publishRatings(assignmentId);
    } catch (e) {
      throw new Error(getApiErrorMessage(e));
    }
  };

  const unpublishAssignmentResults = async (assignmentId) => {
    try {
      return await performanceService.unpublishAssignmentResults(assignmentId);
    } catch (e) {
      throw new Error(getApiErrorMessage(e));
    }
  };

  const saveManagerEvaluationDraft = async ({ employeeId, assignmentId, answers }) => {
    try {
      const payload = buildSelfOrManagerSubmitPayload(answers);
      return await performanceService.saveManagerEvaluationDraft(employeeId, assignmentId, payload);
    } catch (e) {
      const err = new Error(getApiErrorMessage(e));
      // Attach status for UI-specific handling (403/409).
      err.status = e?.response?.status;
      throw err;
    }
  };

  return {
    getReviewFormById,
    getAssignmentById,
    publishRatings,
    unpublishAssignmentResults,
    saveManagerEvaluationDraft,
  };
};

export default usePerformanceApi;

