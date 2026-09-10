import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { ACTIVE_CYCLE_ID } from '../../../services/mock/mockData/performanceCycles';
import type { Goal, GoalCategory, GoalStatus } from '../../../types/goal';
import { clearAuth } from './authSlice';
import {
  createGoal,
  fetchGoalsByCycle,
  fetchGoalsByEmployee,
  fetchTeamGoals,
  updateGoalProgress,
  updateGoalStatus,
} from './goalsThunks';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type TeamGoalFilters = {
  employeeId: string;
  category: GoalCategory | 'ALL';
  status: GoalStatus | 'ALL';
};

export type GoalsState = {
  employeeGoals: Goal[];
  teamGoals: Goal[];
  selectedGoal: Goal | null;
  activeCycleId: string;
  teamFilters: TeamGoalFilters;
  listStatus: AsyncStatus;
  mutationStatus: AsyncStatus;
  error: string | null;
  successMessage: string | null;
};

const initialState: GoalsState = {
  employeeGoals: [],
  teamGoals: [],
  selectedGoal: null,
  activeCycleId: ACTIVE_CYCLE_ID,
  teamFilters: {
    employeeId: 'ALL',
    category: 'ALL',
    status: 'ALL',
  },
  listStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
  successMessage: null,
};

function upsertGoal(state: GoalsState, goal: Goal) {
  const employeeIndex = state.employeeGoals.findIndex((g) => g.id === goal.id);
  if (employeeIndex >= 0) {
    state.employeeGoals[employeeIndex] = goal;
  }

  const teamIndex = state.teamGoals.findIndex((g) => g.id === goal.id);
  if (teamIndex >= 0) {
    state.teamGoals[teamIndex] = goal;
  } else if (state.teamGoals.some((g) => g.employeeId === goal.employeeId)) {
    state.teamGoals.push(goal);
  }

  if (state.selectedGoal?.id === goal.id) {
    state.selectedGoal = goal;
  }
}

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    setSelectedGoal: (state, action: PayloadAction<Goal | null>) => {
      state.selectedGoal = action.payload;
    },
    setTeamFilters: (state, action: PayloadAction<Partial<TeamGoalFilters>>) => {
      state.teamFilters = { ...state.teamFilters, ...action.payload };
    },
    clearGoalsError: (state) => {
      state.error = null;
    },
    clearGoalsSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearAuth, () => ({ ...initialState }));

    builder
      .addCase(fetchGoalsByEmployee.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchGoalsByEmployee.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.employeeGoals = action.payload;
      })
      .addCase(fetchGoalsByEmployee.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to load goals';
      });

    builder
      .addCase(fetchGoalsByCycle.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchGoalsByCycle.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.teamGoals = action.payload;
      })
      .addCase(fetchGoalsByCycle.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to load cycle goals';
      });

    builder
      .addCase(fetchTeamGoals.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchTeamGoals.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.teamGoals = action.payload;
      })
      .addCase(fetchTeamGoals.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to load team goals';
      });

    builder
      .addCase(createGoal.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.employeeGoals.push(action.payload);
        state.successMessage = 'Goal created';
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to create goal';
      });

    builder
      .addCase(updateGoalStatus.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateGoalStatus.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        upsertGoal(state, action.payload);
        state.successMessage = 'Goal status updated';
      })
      .addCase(updateGoalStatus.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to update goal status';
      });

    builder
      .addCase(updateGoalProgress.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addCase(updateGoalProgress.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        upsertGoal(state, action.payload);
        state.successMessage = 'Goal progress updated';
      })
      .addCase(updateGoalProgress.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to update goal progress';
      });
  },
});

export const { setSelectedGoal, setTeamFilters, clearGoalsError, clearGoalsSuccess } =
  goalsSlice.actions;

type GoalsRoot = { goals: GoalsState };

export const selectEmployeeGoals = (state: GoalsRoot) => state.goals.employeeGoals;
export const selectTeamGoals = (state: GoalsRoot) => state.goals.teamGoals;
export const selectSelectedGoal = (state: GoalsRoot) => state.goals.selectedGoal;
export const selectActiveCycleId = (state: GoalsRoot) => state.goals.activeCycleId;
export const selectTeamFilters = (state: GoalsRoot) => state.goals.teamFilters;
export const selectGoalsListStatus = (state: GoalsRoot) => state.goals.listStatus;
export const selectGoalsMutationStatus = (state: GoalsRoot) => state.goals.mutationStatus;
export const selectGoalsError = (state: GoalsRoot) => state.goals.error;
export const selectGoalsSuccess = (state: GoalsRoot) => state.goals.successMessage;

export const selectFilteredTeamGoals = createSelector(
  [selectTeamGoals, selectTeamFilters],
  (teamGoals, filters) =>
    teamGoals.filter((goal) => {
      if (filters.employeeId !== 'ALL' && goal.employeeId !== filters.employeeId) {
        return false;
      }
      if (filters.category !== 'ALL' && goal.category !== filters.category) {
        return false;
      }
      if (filters.status !== 'ALL' && goal.status !== filters.status) {
        return false;
      }
      return true;
    }),
);

export default goalsSlice.reducer;
