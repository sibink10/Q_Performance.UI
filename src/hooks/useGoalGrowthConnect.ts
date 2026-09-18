import { useCallback, useState } from 'react';
import type { GoalGrowthConnectEntry } from '../types/growthConnect';
import type { GoalStatus } from '../types/goal';
import growthConnectService from '../services/growthConnectService';
import { getApiErrorMessage } from '../utils/helpers';

const useGoalGrowthConnect = () => {
  const [entries, setEntries] = useState<GoalGrowthConnectEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadEntries = useCallback(async (goalId: string) => {
    if (!goalId) return;
    setIsLoading(true);
    setError(null);
    try {
      setEntries(await growthConnectService.fetchGoalEntries(goalId));
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load Growth Connect entries.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertEntry = useCallback((updated: GoalGrowthConnectEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

  const submitEmployeeUpdate = useCallback(
    async (entryId: string, employeeUpdate: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await growthConnectService.submitEmployeeUpdate(entryId, employeeUpdate);
        upsertEntry(updated);
        setSuccessMessage('Your update was submitted.');
        return updated;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to submit your update.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [upsertEntry],
  );

  const submitManagerFeedback = useCallback(
    async (entryId: string, managerStatus: GoalStatus, managerFeedback: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await growthConnectService.submitManagerFeedback(entryId, managerStatus, managerFeedback);
        upsertEntry(updated);
        setSuccessMessage('Feedback submitted.');
        return updated;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to submit feedback.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [upsertEntry],
  );

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
    entries,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadEntries,
    submitEmployeeUpdate,
    submitManagerFeedback,
    clearError,
    clearSuccess,
  };
};

export default useGoalGrowthConnect;
