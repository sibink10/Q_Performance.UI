import { useCallback, useMemo, useState } from 'react';
import type { Goal, GoalCategory, GoalStatus } from '../types/goal';
import useAuth from './useAuth';
import goalsService from '../services/goalsService';
import { getApiErrorMessage } from '../utils/helpers';

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
  const currentUserId: string | null = user?.employeeId ?? null;

  const [employeeGoals, setEmployeeGoals] = useState<Goal[]>([]);
  const [teamGoals, setTeamGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoalState] = useState<Goal | null>(null);
  const [teamFilters, setTeamFiltersState] = useState<TeamGoalFilters>(defaultTeamFilters);
  const [isLoading, setIsLoading] = useState(false);
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
    if (!currentUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      setEmployeeGoals(await goalsService.getGoalsByEmployee(currentUserId));
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load goals.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  const loadTeamGoals = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      setTeamGoals(await goalsService.getTeamGoals(currentUserId));
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load team goals.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  /** Loads every goal across the org (admin "all goals" view). */
  const loadCycleGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTeamGoals(await goalsService.getAllGoals());
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load goals.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    teamFilters,
    currentUserId,
    isLoading,
    error,
    successMessage,
    loadMyGoals,
    loadTeamGoals,
    loadCycleGoals,
    selectGoal,
    setTeamFilters,
    clearError,
    clearSuccess,
  };
};

export type { GoalCategory, GoalStatus };
export default useGoals;
