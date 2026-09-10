import { createAsyncThunk } from '@reduxjs/toolkit';
import performanceCycleService, {
  type AssignEmployeesResult,
  type CreateCyclePayload,
  type UpdateStagePatch,
} from '../../../services/performanceCycleService';
import type { PerformanceCycle } from '../../../types/performanceCycle';
import { getApiErrorMessage } from '../../../utils/helpers';

export const fetchCycles = createAsyncThunk(
  'performanceCycle/fetchCycles',
  async (_, { rejectWithValue }) => {
    try {
      return await performanceCycleService.getCycles();
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const fetchCycleById = createAsyncThunk(
  'performanceCycle/fetchCycleById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await performanceCycleService.getCycleById(id);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const createCycle = createAsyncThunk(
  'performanceCycle/createCycle',
  async (payload: CreateCyclePayload, { rejectWithValue, dispatch }) => {
    try {
      await performanceCycleService.createCycle(payload);
      await dispatch(fetchCycles());
      return 'Performance cycle created';
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const updateCycleStage = createAsyncThunk(
  'performanceCycle/updateCycleStage',
  async (
    {
      cycleId,
      stageId,
      patch,
    }: { cycleId: string; stageId: string; patch: UpdateStagePatch },
    { rejectWithValue },
  ) => {
    try {
      return await performanceCycleService.updateStage(cycleId, stageId, patch);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const assignEmployeesToCycle = createAsyncThunk(
  'performanceCycle/assignEmployees',
  async (
    { cycleId, employeeIds }: { cycleId: string; employeeIds: string[] },
    { rejectWithValue },
  ) => {
    try {
      return await performanceCycleService.assignEmployees(cycleId, employeeIds);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export type { PerformanceCycle, AssignEmployeesResult, CreateCyclePayload, UpdateStagePatch };
