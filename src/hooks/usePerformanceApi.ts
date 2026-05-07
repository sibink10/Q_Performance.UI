// @ts-nocheck
import performanceService from '../services/performanceService';
import { getApiErrorMessage, toEntityFromPayload } from '../utils/helpers';

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

  return {
    getReviewFormById,
    getAssignmentById,
    publishRatings,
    unpublishAssignmentResults,
  };
};

export default usePerformanceApi;

