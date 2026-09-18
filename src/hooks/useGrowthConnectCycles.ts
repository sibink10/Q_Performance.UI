import { useCallback, useState } from 'react';
import type { GrowthConnectCycle } from '../types/growthConnect';
import growthConnectService from '../services/growthConnectService';
import { getApiErrorMessage } from '../utils/helpers';

const useGrowthConnectCycles = () => {
  const [cycles, setCycles] = useState<GrowthConnectCycle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCycles = useCallback(async (financialYearId: string) => {
    if (!financialYearId) return;
    setIsLoading(true);
    setError(null);
    try {
      setCycles(await growthConnectService.fetchCycles(financialYearId));
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load Growth Connect cycles.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertCycle = useCallback((updated: GrowthConnectCycle) => {
    setCycles((prev) =>
      prev.some((c) => c.id === updated.id)
        ? prev.map((c) => (c.id === updated.id ? updated : c))
        : [...prev, updated].sort((a, b) => a.sequenceNo - b.sequenceNo),
    );
  }, []);

  const createCycle = useCallback(
    async (financialYearId: string, payload: { name: string; startDate: string; endDate: string }) => {
      setIsMutating(true);
      setError(null);
      try {
        const cycle = await growthConnectService.createCycle(financialYearId, payload);
        upsertCycle(cycle);
        setSuccessMessage(`"${cycle.name}" was created.`);
        return cycle;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to create Growth Connect cycle.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [upsertCycle],
  );

  const updateCycle = useCallback(
    async (id: string, payload: { name: string; startDate: string; endDate: string }) => {
      setIsMutating(true);
      setError(null);
      try {
        const cycle = await growthConnectService.updateCycle(id, payload);
        upsertCycle(cycle);
        setSuccessMessage(`"${cycle.name}" was updated.`);
        return cycle;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to update Growth Connect cycle.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [upsertCycle],
  );

  const openCycle = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const cycle = await growthConnectService.openCycle(id);
        upsertCycle(cycle);
        setSuccessMessage(`"${cycle.name}" is now open for submissions.`);
        return cycle;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to open Growth Connect cycle.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [upsertCycle],
  );

  const closeCycle = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const cycle = await growthConnectService.closeCycle(id);
        upsertCycle(cycle);
        setSuccessMessage(`"${cycle.name}" was closed.`);
        return cycle;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to close Growth Connect cycle.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [upsertCycle],
  );

  const deleteCycle = useCallback(async (id: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await growthConnectService.deleteCycle(id);
      setCycles((prev) => prev.filter((c) => c.id !== id));
      setSuccessMessage('Growth Connect cycle deleted.');
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to delete Growth Connect cycle.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
    cycles,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadCycles,
    createCycle,
    updateCycle,
    openCycle,
    closeCycle,
    deleteCycle,
    clearError,
    clearSuccess,
  };
};

export default useGrowthConnectCycles;
