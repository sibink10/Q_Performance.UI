import { createSlice } from '@reduxjs/toolkit';
import type { PerformanceCycle } from '../../../types/performanceCycle';
import { clearAuth } from './authSlice';
import {
  assignEmployeesToCycle,
  createCycle,
  fetchCycleById,
  fetchCycles,
  updateCycleStage,
} from './performanceCycleThunks';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type PerformanceCycleState = {
  cycles: PerformanceCycle[];
  selectedCycle: PerformanceCycle | null;
  employeeAssignments: Record<string, string[]>;
  listStatus: AsyncStatus;
  detailStatus: AsyncStatus;
  mutationStatus: AsyncStatus;
  error: string | null;
  successMessage: string | null;
};

const initialState: PerformanceCycleState = {
  cycles: [],
  selectedCycle: null,
  employeeAssignments: {},
  listStatus: 'idle',
  detailStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
  successMessage: null,
};

function upsertCycle(state: PerformanceCycleState, cycle: PerformanceCycle) {
  const index = state.cycles.findIndex((c) => c.id === cycle.id);
  if (index >= 0) {
    state.cycles[index] = cycle;
  } else {
    state.cycles.push(cycle);
  }
  if (state.selectedCycle?.id === cycle.id) {
    state.selectedCycle = cycle;
  }
}

const performanceCycleSlice = createSlice({
  name: 'performanceCycle',
  initialState,
  reducers: {
    clearCycleError: (state) => {
      state.error = null;
    },
    clearCycleSuccess: (state) => {
      state.successMessage = null;
    },
    setSelectedCycle: (state, action: { payload: PerformanceCycle | null }) => {
      state.selectedCycle = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearAuth, () => ({ ...initialState }));

    builder
      .addCase(fetchCycles.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchCycles.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.cycles = action.payload;
        if (state.selectedCycle) {
          const refreshed = action.payload.find((c) => c.id === state.selectedCycle?.id);
          state.selectedCycle = refreshed ?? null;
        }
      })
      .addCase(fetchCycles.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to load performance cycles';
      });

    builder
      .addCase(fetchCycleById.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchCycleById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.selectedCycle = action.payload;
        upsertCycle(state, action.payload);
      })
      .addCase(fetchCycleById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to load performance cycle';
      });

    builder
      .addCase(createCycle.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createCycle.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.successMessage = action.payload;
      })
      .addCase(createCycle.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to create performance cycle';
      });

    builder
      .addCase(updateCycleStage.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCycleStage.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        upsertCycle(state, action.payload);
        state.successMessage = 'Stage updated';
      })
      .addCase(updateCycleStage.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to update stage';
      });

    builder
      .addCase(assignEmployeesToCycle.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addCase(assignEmployeesToCycle.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.employeeAssignments[action.payload.cycleId] = action.payload.employeeIds;
        state.successMessage = 'Employees assigned to cycle';
      })
      .addCase(assignEmployeesToCycle.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to assign employees';
      });
  },
});

export const { clearCycleError, clearCycleSuccess, setSelectedCycle } =
  performanceCycleSlice.actions;

type PerformanceCycleRoot = { performanceCycle: PerformanceCycleState };

export const selectCycles = (state: PerformanceCycleRoot) => state.performanceCycle.cycles;
export const selectSelectedCycle = (state: PerformanceCycleRoot) =>
  state.performanceCycle.selectedCycle;
export const selectCycleListStatus = (state: PerformanceCycleRoot) =>
  state.performanceCycle.listStatus;
export const selectCycleDetailStatus = (state: PerformanceCycleRoot) =>
  state.performanceCycle.detailStatus;
export const selectCycleMutationStatus = (state: PerformanceCycleRoot) =>
  state.performanceCycle.mutationStatus;
export const selectCycleError = (state: PerformanceCycleRoot) => state.performanceCycle.error;
export const selectCycleSuccess = (state: PerformanceCycleRoot) =>
  state.performanceCycle.successMessage;
export const selectCycleEmployeeAssignments = (state: PerformanceCycleRoot) =>
  state.performanceCycle.employeeAssignments;

export default performanceCycleSlice.reducer;
