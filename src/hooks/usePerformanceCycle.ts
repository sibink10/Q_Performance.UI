import { useCallback, useState } from 'react';
import type { PerformanceCycle } from '../types/performanceCycle';
import type { CreateCyclePayload, UpdateCyclePayload } from '../services/performanceCycleService';
import performanceCycleService from '../services/performanceCycleService';
import { getApiErrorMessage } from '../utils/helpers';

const usePerformanceCycle = () => {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCycle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCycles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await performanceCycleService.getCycles();
      setCycles(result);
      setSelectedCycle((prev) => (prev ? result.find((c) => c.id === prev.id) ?? null : prev));
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load performance cycles.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCycleById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const cycle = await performanceCycleService.getCycleById(id);
      setSelectedCycle(cycle);
      setCycles((prev) => (prev.some((c) => c.id === cycle.id) ? prev.map((c) => (c.id === cycle.id ? cycle : c)) : [...prev, cycle]));
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load performance cycle.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectCycle = useCallback((cycle: PerformanceCycle | null) => {
    setSelectedCycle(cycle);
  }, []);

  const createCycle = useCallback(async (payload: CreateCyclePayload) => {
    setIsMutating(true);
    setError(null);
    try {
      const created = await performanceCycleService.createCycle(payload);
      setCycles((prev) => [...prev, created]);
      setSuccessMessage('Performance cycle created');
      return created;
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to create performance cycle.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateCycle = useCallback(async (cycleId: string, payload: UpdateCyclePayload) => {
    setIsMutating(true);
    setError(null);
    try {
      const updated = await performanceCycleService.updateCycle(cycleId, payload);
      setCycles((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedCycle((prev) => (prev?.id === updated.id ? updated : prev));
      setSuccessMessage('Performance cycle updated');
      return updated;
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to update performance cycle.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const deleteCycle = useCallback(async (cycleId: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await performanceCycleService.deleteCycle(cycleId);
      setCycles((prev) => prev.filter((c) => c.id !== cycleId));
      setSelectedCycle((prev) => (prev?.id === cycleId ? null : prev));
      setSuccessMessage('Performance cycle deleted');
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to delete performance cycle.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
    cycles,
    selectedCycle,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadCycles,
    loadCycleById,
    selectCycle,
    createCycle,
    updateCycle,
    deleteCycle,
    clearError,
    clearSuccess,
  };
};

export default usePerformanceCycle;
