import { useCallback, useState } from 'react';
import type { GoalHistoryEntry } from '../types/goalHistory';
import type { GoalRevision, ProposedGoalChanges } from '../types/goalRevision';
import type { RevisionReasonKey } from '../utils/revisionReasonConstants';
import useAuth from './useAuth';
import goalRevisionService from '../services/goalRevisionService';
import { resolveMockUserId } from '../utils/resolveMockUserId';

const useGoalRevisions = () => {
  const { user } = useAuth();
  const mockUserId = resolveMockUserId(user);

  const [pendingRevisions, setPendingRevisions] = useState<GoalRevision[]>([]);
  const [managerRequests, setManagerRequests] = useState<GoalRevision[]>([]);
  const [goalHistory, setGoalHistory] = useState<GoalHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const submitRevisionRequest = useCallback(
    async (input: {
      goalId: string;
      employeeId: string;
      reason: RevisionReasonKey;
      otherReason?: string;
      proposedChanges: ProposedGoalChanges;
    }) => {
      setIsMutating(true);
      setError(null);
      try {
        const revision = await goalRevisionService.submitRevisionRequest({
          ...input,
          requestedBy: mockUserId,
        });
        setManagerRequests((prev) => [...prev, revision]);
        setSuccessMessage(
          'Revision request submitted successfully. The goal will remain unchanged until Admin/HR approval.',
        );
        return revision;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit revision request.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [mockUserId],
  );

  const getPendingRevisions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPendingRevisions(await goalRevisionService.fetchPendingRevisions());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pending revisions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getManagerRevisionRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setManagerRequests(await goalRevisionService.fetchManagerRevisionRequests(mockUserId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load your revision requests.');
    } finally {
      setIsLoading(false);
    }
  }, [mockUserId]);

  const upsertRevision = useCallback((updated: GoalRevision) => {
    setPendingRevisions((prev) =>
      prev.some((r) => r.id === updated.id) ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev,
    );
    setManagerRequests((prev) =>
      prev.some((r) => r.id === updated.id) ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev,
    );
  }, []);

  const approveRevision = useCallback(
    async (id: string, reviewComment: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await goalRevisionService.approveRevision(id, {
          reviewerId: mockUserId,
          reviewComment,
        });
        upsertRevision(updated);
        setSuccessMessage('Revision request approved and goal updated.');
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to approve revision request.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [mockUserId, upsertRevision],
  );

  const rejectRevision = useCallback(
    async (id: string, reviewComment: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await goalRevisionService.rejectRevision(id, {
          reviewerId: mockUserId,
          reviewComment,
        });
        upsertRevision(updated);
        setSuccessMessage('Revision request rejected. The goal was not changed.');
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to reject revision request.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [mockUserId, upsertRevision],
  );

  const getGoalHistory = useCallback(async (goalId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setGoalHistory(await goalRevisionService.fetchGoalHistory(goalId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load goal history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
    pendingRevisions,
    managerRequests,
    goalHistory,
    mockUserId,
    isLoading,
    isMutating,
    error,
    successMessage,
    submitRevisionRequest,
    getPendingRevisions,
    getManagerRevisionRequests,
    approveRevision,
    rejectRevision,
    getGoalHistory,
    clearError,
    clearSuccess,
  };
};

export default useGoalRevisions;
