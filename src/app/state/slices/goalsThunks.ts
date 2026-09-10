import { createAsyncThunk } from '@reduxjs/toolkit';
import goalsService, {
  type CreateGoalPayload,
  type UpdateGoalPatch,
} from '../../../services/goalsService';
import type { Goal } from '../../../types/goal';
import { getApiErrorMessage } from '../../../utils/helpers';

export const fetchGoalsByEmployee = createAsyncThunk(
  'goals/fetchByEmployee',
  async (
    { employeeId, cycleId }: { employeeId: string; cycleId: string },
    { rejectWithValue },
  ) => {
    try {
      return await goalsService.getGoalsByEmployee(employeeId, cycleId);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const fetchGoalsByCycle = createAsyncThunk(
  'goals/fetchByCycle',
  async (cycleId: string, { rejectWithValue }) => {
    try {
      return await goalsService.getGoalsByCycle(cycleId);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const fetchTeamGoals = createAsyncThunk(
  'goals/fetchTeamGoals',
  async (
    { managerId, cycleId }: { managerId: string; cycleId: string },
    { rejectWithValue },
  ) => {
    try {
      return await goalsService.getTeamGoals(managerId, cycleId);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const createGoal = createAsyncThunk(
  'goals/createGoal',
  async (payload: CreateGoalPayload, { rejectWithValue }) => {
    try {
      return await goalsService.createGoal(payload);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const updateGoalStatus = createAsyncThunk(
  'goals/updateGoalStatus',
  async (
    { goalId, status }: { goalId: string; status: Goal['status'] },
    { rejectWithValue },
  ) => {
    try {
      return await goalsService.updateGoal(goalId, { status });
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const updateGoalProgress = createAsyncThunk(
  'goals/updateGoalProgress',
  async (
    { goalId, progress }: { goalId: string; progress: number },
    { rejectWithValue },
  ) => {
    try {
      return await goalsService.updateGoal(goalId, { progress });
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export type { CreateGoalPayload, UpdateGoalPatch };
