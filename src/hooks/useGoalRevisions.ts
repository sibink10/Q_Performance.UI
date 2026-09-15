import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../app/state';
import type { ProposedGoalChanges } from '../types/goalRevision';
import type { RevisionReasonKey } from '../utils/revisionReasonConstants';
import useAuth from './useAuth';
import {
  clearGoalRevisionsError,
  clearGoalRevisionsSuccess,
  selectGoalHistory,
  selectGoalRevisionsError,
  selectGoalRevisionsListStatus,
  selectGoalRevisionsMutationStatus,
  selectGoalRevisionsSuccess,
  selectManagerRevisionRequests,
  selectPendingRevisions,
} from '../app/state/slices/goalRevisionSlice';
import {
  approveRevision,
  fetchGoalHistory,
  fetchManagerRevisionRequests,
  fetchPendingRevisions,
  rejectRevision,
  submitRevisionRequest,
} from '../app/state/slices/goalRevisionThunks';
import { resolveMockUserId } from '../utils/resolveMockUserId';

const useGoalRevisions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const pendingRevisions = useSelector(selectPendingRevisions);
  const managerRequests = useSelector(selectManagerRevisionRequests);
  const goalHistory = useSelector(selectGoalHistory);
  const listStatus = useSelector(selectGoalRevisionsListStatus);
  const mutationStatus = useSelector(selectGoalRevisionsMutationStatus);
  const error = useSelector(selectGoalRevisionsError);
  const successMessage = useSelector(selectGoalRevisionsSuccess);

  const mockUserId = resolveMockUserId(user);

  const submitRequest = useCallback(
    (input: {
      goalId: string;
      employeeId: string;
      reason: RevisionReasonKey;
      otherReason?: string;
      proposedChanges: ProposedGoalChanges;
    }) => dispatch(submitRevisionRequest({ ...input, requestedBy: mockUserId })),
    [dispatch, mockUserId],
  );

  const getPendingRevisions = useCallback(() => {
    dispatch(fetchPendingRevisions());
  }, [dispatch]);

  const getManagerRevisionRequests = useCallback(() => {
    dispatch(fetchManagerRevisionRequests(mockUserId));
  }, [dispatch, mockUserId]);

  const approve = useCallback(
    (id: string, reviewComment: string) =>
      dispatch(approveRevision({ id, reviewerId: mockUserId, reviewComment })),
    [dispatch, mockUserId],
  );

  const reject = useCallback(
    (id: string, reviewComment: string) =>
      dispatch(rejectRevision({ id, reviewerId: mockUserId, reviewComment })),
    [dispatch, mockUserId],
  );

  const getGoalHistory = useCallback(
    (goalId: string) => {
      dispatch(fetchGoalHistory(goalId));
    },
    [dispatch],
  );

  const clearError = useCallback(() => {
    dispatch(clearGoalRevisionsError());
  }, [dispatch]);

  const clearSuccess = useCallback(() => {
    dispatch(clearGoalRevisionsSuccess());
  }, [dispatch]);

  return {
    pendingRevisions,
    managerRequests,
    goalHistory,
    mockUserId,
    listStatus,
    mutationStatus,
    isLoading: listStatus === 'loading',
    isMutating: mutationStatus === 'loading',
    error,
    successMessage,
    submitRevisionRequest: submitRequest,
    getPendingRevisions,
    getManagerRevisionRequests,
    approveRevision: approve,
    rejectRevision: reject,
    getGoalHistory,
    clearError,
    clearSuccess,
  };
};

export default useGoalRevisions;
