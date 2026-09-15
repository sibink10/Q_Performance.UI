import { createSlice } from '@reduxjs/toolkit';
import type { GoalHistoryEntry } from '../../../types/goalHistory';
import type { GoalRevision } from '../../../types/goalRevision';
import { clearAuth } from './authSlice';
import {
  approveRevision,
  fetchGoalHistory,
  fetchManagerRevisionRequests,
  fetchPendingRevisions,
  rejectRevision,
  submitRevisionRequest,
} from './goalRevisionThunks';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type GoalRevisionState = {
  pendingRevisions: GoalRevision[];
  managerRequests: GoalRevision[];
  goalHistory: GoalHistoryEntry[];
  listStatus: AsyncStatus;
  mutationStatus: AsyncStatus;
  error: string | null;
  successMessage: string | null;
};

const initialState: GoalRevisionState = {
  pendingRevisions: [],
  managerRequests: [],
  goalHistory: [],
  listStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
  successMessage: null,
};

function upsertRevision(state: GoalRevisionState, revision: GoalRevision) {
  const pendingIndex = state.pendingRevisions.findIndex((r) => r.id === revision.id);
  if (pendingIndex >= 0) {
    state.pendingRevisions[pendingIndex] = revision;
  }

  const managerIndex = state.managerRequests.findIndex((r) => r.id === revision.id);
  if (managerIndex >= 0) {
    state.managerRequests[managerIndex] = revision;
  }
}

const goalRevisionSlice = createSlice({
  name: 'goalRevisions',
  initialState,
  reducers: {
    clearGoalRevisionsError: (state) => {
      state.error = null;
    },
    clearGoalRevisionsSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearAuth, () => ({ ...initialState }));

    builder
      .addCase(submitRevisionRequest.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(submitRevisionRequest.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.managerRequests.push(action.payload);
        state.successMessage =
          'Revision request submitted successfully. The goal will remain unchanged until Admin/HR approval.';
      })
      .addCase(submitRevisionRequest.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to submit revision request';
      });

    builder
      .addCase(fetchPendingRevisions.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchPendingRevisions.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.pendingRevisions = action.payload;
      })
      .addCase(fetchPendingRevisions.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to load revision requests';
      });

    builder
      .addCase(fetchManagerRevisionRequests.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchManagerRevisionRequests.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.managerRequests = action.payload;
      })
      .addCase(fetchManagerRevisionRequests.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to load your revision requests';
      });

    builder
      .addCase(approveRevision.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(approveRevision.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        upsertRevision(state, action.payload);
        state.successMessage = 'Revision request approved and goal updated.';
      })
      .addCase(approveRevision.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to approve revision request';
      });

    builder
      .addCase(rejectRevision.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(rejectRevision.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        upsertRevision(state, action.payload);
        state.successMessage = 'Revision request rejected. The goal was not changed.';
      })
      .addCase(rejectRevision.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to reject revision request';
      });

    builder
      .addCase(fetchGoalHistory.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchGoalHistory.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.goalHistory = action.payload;
      })
      .addCase(fetchGoalHistory.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Failed to load goal history';
      });
  },
});

export const { clearGoalRevisionsError, clearGoalRevisionsSuccess } = goalRevisionSlice.actions;

type GoalRevisionsRoot = { goalRevisions: GoalRevisionState };

export const selectPendingRevisions = (state: GoalRevisionsRoot) =>
  state.goalRevisions.pendingRevisions;
export const selectManagerRevisionRequests = (state: GoalRevisionsRoot) =>
  state.goalRevisions.managerRequests;
export const selectGoalHistory = (state: GoalRevisionsRoot) => state.goalRevisions.goalHistory;
export const selectGoalRevisionsListStatus = (state: GoalRevisionsRoot) =>
  state.goalRevisions.listStatus;
export const selectGoalRevisionsMutationStatus = (state: GoalRevisionsRoot) =>
  state.goalRevisions.mutationStatus;
export const selectGoalRevisionsError = (state: GoalRevisionsRoot) => state.goalRevisions.error;
export const selectGoalRevisionsSuccess = (state: GoalRevisionsRoot) =>
  state.goalRevisions.successMessage;

export default goalRevisionSlice.reducer;
