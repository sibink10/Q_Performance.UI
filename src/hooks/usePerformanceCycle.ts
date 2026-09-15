import { useCallback, useState } from 'react';
import type { CycleStageStatus, PerformanceCycle } from '../types/performanceCycle';
import type { CreateCyclePayload } from '../services/performanceCycleService';
import performanceCycleService from '../services/performanceCycleService';

const usePerformanceCycle = () => {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCycle | null>(null);
  const [employeeAssignments, setEmployeeAssignments] = useState<Record<string, string[]>>({});
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
      setError(e instanceof Error ? e.message : 'Failed to load performance cycles.');
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
      setError(e instanceof Error ? e.message : 'Failed to load performance cycle.');
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
      setError(e instanceof Error ? e.message : 'Failed to create performance cycle.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const applyStageUpdate = useCallback(
    async (cycleId: string, stageId: string, status: CycleStageStatus) => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await performanceCycleService.updateStage(cycleId, stageId, { status });
        setCycles((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSelectedCycle((prev) => (prev?.id === updated.id ? updated : prev));
        setSuccessMessage('Stage updated');
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update stage.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [],
  );

  const activateStage = useCallback(
    (cycleId: string, stageId: string) => applyStageUpdate(cycleId, stageId, 'ACTIVE'),
    [applyStageUpdate],
  );

  const lockStage = useCallback(
    (cycleId: string, stageId: string) => applyStageUpdate(cycleId, stageId, 'LOCKED'),
    [applyStageUpdate],
  );

  const reopenStage = useCallback(
    (cycleId: string, stageId: string) => applyStageUpdate(cycleId, stageId, 'ACTIVE'),
    [applyStageUpdate],
  );

  const assignEmployees = useCallback(async (cycleId: string, employeeIds: string[]) => {
    setIsMutating(true);
    setError(null);
    try {
      const result = await performanceCycleService.assignEmployees(cycleId, employeeIds);
      setEmployeeAssignments((prev) => ({ ...prev, [cycleId]: employeeIds }));
      setSuccessMessage('Employees assigned to cycle');
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign employees to cycle.');
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
    employeeAssignments,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadCycles,
    loadCycleById,
    selectCycle,
    createCycle,
    activateStage,
    lockStage,
    reopenStage,
    assignEmployees,
    clearError,
    clearSuccess,
  };
};

export default usePerformanceCycle;
