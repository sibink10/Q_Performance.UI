import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { PerformanceCycle } from '../types/performanceCycle';
import type { CreateCyclePayload } from '../services/performanceCycleService';
import {
  clearCycleError,
  clearCycleSuccess,
  selectCycleDetailStatus,
  selectCycleEmployeeAssignments,
  selectCycleError,
  selectCycleListStatus,
  selectCycleMutationStatus,
  selectCycleSuccess,
  selectCycles,
  selectSelectedCycle,
  setSelectedCycle,
} from '../app/state/slices/performanceCycleSlice';
import {
  assignEmployeesToCycle,
  createCycle,
  fetchCycleById,
  fetchCycles,
  updateCycleStage,
} from '../app/state/slices/performanceCycleThunks';

const usePerformanceCycle = () => {
  const dispatch = useDispatch();

  const cycles = useSelector(selectCycles);
  const selectedCycle = useSelector(selectSelectedCycle);
  const employeeAssignments = useSelector(selectCycleEmployeeAssignments);
  const listStatus = useSelector(selectCycleListStatus);
  const detailStatus = useSelector(selectCycleDetailStatus);
  const mutationStatus = useSelector(selectCycleMutationStatus);
  const error = useSelector(selectCycleError);
  const successMessage = useSelector(selectCycleSuccess);

  useEffect(() => {
    dispatch(fetchCycles());
  }, [dispatch]);

  const loadCycles = useCallback(() => {
    dispatch(fetchCycles());
  }, [dispatch]);

  const loadCycleById = useCallback(
    (id: string) => {
      dispatch(fetchCycleById(id));
    },
    [dispatch],
  );

  const selectCycle = useCallback(
    (cycle: PerformanceCycle | null) => {
      dispatch(setSelectedCycle(cycle));
    },
    [dispatch],
  );

  const createPerformanceCycle = useCallback(
    (payload: CreateCyclePayload) => {
      dispatch(createCycle(payload));
    },
    [dispatch],
  );

  const activateStage = useCallback(
    (cycleId: string, stageId: string) => {
      dispatch(updateCycleStage({ cycleId, stageId, patch: { status: 'ACTIVE' } }));
    },
    [dispatch],
  );

  const lockStage = useCallback(
    (cycleId: string, stageId: string) => {
      dispatch(updateCycleStage({ cycleId, stageId, patch: { status: 'LOCKED' } }));
    },
    [dispatch],
  );

  const reopenStage = useCallback(
    (cycleId: string, stageId: string) => {
      dispatch(updateCycleStage({ cycleId, stageId, patch: { status: 'ACTIVE' } }));
    },
    [dispatch],
  );

  const assignEmployees = useCallback(
    (cycleId: string, employeeIds: string[]) => {
      dispatch(assignEmployeesToCycle({ cycleId, employeeIds }));
    },
    [dispatch],
  );

  const clearError = useCallback(() => {
    dispatch(clearCycleError());
  }, [dispatch]);

  const clearSuccess = useCallback(() => {
    dispatch(clearCycleSuccess());
  }, [dispatch]);

  return {
    cycles,
    selectedCycle,
    employeeAssignments,
    listStatus,
    detailStatus,
    mutationStatus,
    isLoading: listStatus === 'loading',
    isMutating: mutationStatus === 'loading',
    error,
    successMessage,
    loadCycles,
    loadCycleById,
    selectCycle,
    createCycle: createPerformanceCycle,
    activateStage,
    lockStage,
    reopenStage,
    assignEmployees,
    clearError,
    clearSuccess,
  };
};

export default usePerformanceCycle;
