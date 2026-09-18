import { useCallback, useState } from 'react';
import type { GrowthConnectRevision } from '../types/growthConnectRevision';
import type { GoalStatus } from '../types/goal';
import type { RevisionReasonKey } from '../utils/revisionReasonConstants';
import growthConnectRevisionService from '../services/growthConnectRevisionService';
import { getApiErrorMessage } from '../utils/helpers';

const useGrowthConnectRevisions = () => {
  const [pendingRevisions, setPendingRevisions] = useState<GrowthConnectRevision[]>([]);
  const [managerRequests, setManagerRequests] = useState<GrowthConnectRevision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const submitRevisionRequest = useCallback(
    async (input: {
      entryId: string;
      reason: RevisionReasonKey;
      otherReason?: string;
      proposedManagerStatus?: GoalStatus;
      proposedManagerFeedback?: string;
    }) => {
      setIsMutating(true);
      setError(null);
      try {
        const revision = await growthConnectRevisionService.submitRevisionRequest(input);
        setManagerRequests((prev) => [...prev, revision]);
        setSuccessMessage(
          'Revision request submitted successfully. The entry will remain unchanged until Admin approval.',
        );
        return revision;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to submit revision request.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [],
  );

  const getPendingRevisions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPendingRevisions(await growthConnectRevisionService.fetchPendingRevisions());
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load pending revisions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getManagerRevisionRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setManagerRequests(await growthConnectRevisionService.fetchManagerRevisionRequests());
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load your revision requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertRevision = useCallback((updated: GrowthConnectRevision) => {
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
        const updated = await growthConnectRevisionService.approveRevision(id, { reviewComment });
        upsertRevision(updated);
        setSuccessMessage('Revision request approved and entry updated.');
        return updated;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to approve revision request.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [upsertRevision],
  );

  const rejectRevision = useCallback(
    async (id: string, reviewComment: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await growthConnectRevisionService.rejectRevision(id, { reviewComment });
        upsertRevision(updated);
        setSuccessMessage('Revision request rejected. The entry was not changed.');
        return updated;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to reject revision request.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [upsertRevision],
  );

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
    pendingRevisions,
    managerRequests,
    isLoading,
    isMutating,
    error,
    successMessage,
    submitRevisionRequest,
    getPendingRevisions,
    getManagerRevisionRequests,
    approveRevision,
    rejectRevision,
    clearError,
    clearSuccess,
  };
};

export default useGrowthConnectRevisions;
