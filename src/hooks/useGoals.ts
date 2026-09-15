import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Goal, GoalCategory, GoalStatus } from '../types/goal';
import useAuth from './useAuth';
import {
  clearGoalsError,
  clearGoalsSuccess,
  selectActiveCycleId,
  selectEmployeeGoals,
  selectFilteredTeamGoals,
  selectGoalsError,
  selectGoalsListStatus,
  selectGoalsMutationStatus,
  selectGoalsSuccess,
  selectSelectedGoal,
  selectTeamFilters,
  selectTeamGoals,
  setSelectedGoal,
  setTeamFilters,
  type TeamGoalFilters,
} from '../app/state/slices/goalsSlice';
import {
  fetchGoalsByCycle,
  fetchGoalsByEmployee,
  fetchTeamGoals,
  updateGoalProgress,
  updateGoalStatus,
} from '../app/state/slices/goalsThunks';
import { resolveMockUserId } from '../utils/resolveMockUserId';

const useGoals = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const employeeGoals = useSelector(selectEmployeeGoals);
  const teamGoals = useSelector(selectTeamGoals);
  const filteredTeamGoals = useSelector(selectFilteredTeamGoals);
  const selectedGoal = useSelector(selectSelectedGoal);
  const activeCycleId = useSelector(selectActiveCycleId);
  const teamFilters = useSelector(selectTeamFilters);
  const listStatus = useSelector(selectGoalsListStatus);
  const mutationStatus = useSelector(selectGoalsMutationStatus);
  const error = useSelector(selectGoalsError);
  const successMessage = useSelector(selectGoalsSuccess);

  const mockUserId = resolveMockUserId(user);

  const loadMyGoals = useCallback(() => {
    dispatch(fetchGoalsByEmployee({ employeeId: mockUserId, cycleId: activeCycleId }));
  }, [dispatch, mockUserId, activeCycleId]);

  const loadTeamGoals = useCallback(() => {
    dispatch(fetchTeamGoals({ managerId: mockUserId, cycleId: activeCycleId }));
  }, [dispatch, mockUserId, activeCycleId]);

  /** Loads every goal in the active cycle, across all employees (admin view). */
  const loadCycleGoals = useCallback(() => {
    dispatch(fetchGoalsByCycle(activeCycleId));
  }, [dispatch, activeCycleId]);

  const selectGoal = useCallback(
    (goal: Goal | null) => {
      dispatch(setSelectedGoal(goal));
    },
    [dispatch],
  );

  const updateStatus = useCallback(
    (goalId: string, status: GoalStatus) => {
      dispatch(updateGoalStatus({ goalId, status }));
    },
    [dispatch],
  );

  const updateProgress = useCallback(
    (goalId: string, progress: number) => {
      dispatch(updateGoalProgress({ goalId, progress }));
    },
    [dispatch],
  );

  const updateTeamFilters = useCallback(
    (filters: Partial<TeamGoalFilters>) => {
      dispatch(setTeamFilters(filters));
    },
    [dispatch],
  );

  const clearError = useCallback(() => {
    dispatch(clearGoalsError());
  }, [dispatch]);

  const clearSuccess = useCallback(() => {
    dispatch(clearGoalsSuccess());
  }, [dispatch]);

  return {
    employeeGoals,
    teamGoals,
    filteredTeamGoals,
    selectedGoal,
    activeCycleId,
    teamFilters,
    mockUserId,
    listStatus,
    mutationStatus,
    isLoading: listStatus === 'loading',
    isMutating: mutationStatus === 'loading',
    error,
    successMessage,
    loadMyGoals,
    loadTeamGoals,
    loadCycleGoals,
    selectGoal,
    updateStatus,
    updateProgress,
    setTeamFilters: updateTeamFilters,
    clearError,
    clearSuccess,
  };
};

export type { GoalCategory, GoalStatus, TeamGoalFilters };
export default useGoals;
