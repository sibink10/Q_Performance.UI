import { useCallback, useMemo, useState } from 'react';
import type { Goal, GoalCategory, GoalStatus } from '../types/goal';
import useAuth from './useAuth';
import goalsService from '../services/goalsService';
import { resolveMockUserId } from '../utils/resolveMockUserId';
import { ACTIVE_CYCLE_ID } from '../services/mock/mockData/performanceCycles';

export type TeamGoalFilters = {
  employeeId: string;
  category: GoalCategory | 'ALL';
  status: GoalStatus | 'ALL';
};

const defaultTeamFilters: TeamGoalFilters = {
  employeeId: 'ALL',
  category: 'ALL',
  status: 'ALL',
};

const useGoals = () => {
  const { user } = useAuth();
  const mockUserId = resolveMockUserId(user);
  const activeCycleId = ACTIVE_CYCLE_ID;

  const [employeeGoals, setEmployeeGoals] = useState<Goal[]>([]);
  const [teamGoals, setTeamGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoalState] = useState<Goal | null>(null);
  const [teamFilters, setTeamFiltersState] = useState<TeamGoalFilters>(defaultTeamFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredTeamGoals = useMemo(
    () =>
      teamGoals.filter((goal) => {
        if (teamFilters.employeeId !== 'ALL' && goal.employeeId !== teamFilters.employeeId) return false;
        if (teamFilters.category !== 'ALL' && goal.category !== teamFilters.category) return false;
        if (teamFilters.status !== 'ALL' && goal.status !== teamFilters.status) return false;
        return true;
      }),
    [teamGoals, teamFilters],
  );

  const loadMyGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setEmployeeGoals(await goalsService.getGoalsByEmployee(mockUserId, activeCycleId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load goals.');
    } finally {
      setIsLoading(false);
    }
  }, [mockUserId, activeCycleId]);

  const loadTeamGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTeamGoals(await goalsService.getTeamGoals(mockUserId, activeCycleId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load team goals.');
    } finally {
      setIsLoading(false);
    }
  }, [mockUserId, activeCycleId]);

  /** Loads every goal in the active cycle, across all employees (admin view). */
  const loadCycleGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTeamGoals(await goalsService.getGoalsByCycle(activeCycleId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cycle goals.');
    } finally {
      setIsLoading(false);
    }
  }, [activeCycleId]);

  const selectGoal = useCallback((goal: Goal | null) => {
    setSelectedGoalState(goal);
  }, []);

  const applyGoalUpdate = useCallback((updated: Goal) => {
    setEmployeeGoals((prev) =>
      prev.some((g) => g.id === updated.id) ? prev.map((g) => (g.id === updated.id ? updated : g)) : prev,
    );
    setTeamGoals((prev) => {
      if (prev.some((g) => g.id === updated.id)) {
        return prev.map((g) => (g.id === updated.id ? updated : g));
      }
      return prev.some((g) => g.employeeId === updated.employeeId) ? [...prev, updated] : prev;
    });
    setSelectedGoalState((prev) => (prev?.id === updated.id ? updated : prev));
  }, []);

  const updateStatus = useCallback(
    async (goalId: string, status: GoalStatus) => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await goalsService.updateGoal(goalId, { status });
        applyGoalUpdate(updated);
        setSuccessMessage('Goal status updated');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update goal status.');
      } finally {
        setIsMutating(false);
      }
    },
    [applyGoalUpdate],
  );

  const updateProgress = useCallback(
    async (goalId: string, progress: number) => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await goalsService.updateGoal(goalId, { progress });
        applyGoalUpdate(updated);
        setSuccessMessage('Goal progress updated');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update goal progress.');
      } finally {
        setIsMutating(false);
      }
    },
    [applyGoalUpdate],
  );

  const setTeamFilters = useCallback((filters: Partial<TeamGoalFilters>) => {
    setTeamFiltersState((prev) => ({ ...prev, ...filters }));
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
    employeeGoals,
    teamGoals,
    filteredTeamGoals,
    selectedGoal,
    activeCycleId,
    teamFilters,
    mockUserId,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadMyGoals,
    loadTeamGoals,
    loadCycleGoals,
    selectGoal,
    updateStatus,
    updateProgress,
    setTeamFilters,
    clearError,
    clearSuccess,
  };
};

export type { GoalCategory, GoalStatus };
export default useGoals;
