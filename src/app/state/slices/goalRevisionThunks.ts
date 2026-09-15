import { createAsyncThunk } from '@reduxjs/toolkit';
import goalRevisionService, {
  type ReviewRevisionPayload,
  type SubmitRevisionRequestPayload,
} from '../../../services/goalRevisionService';
import { getApiErrorMessage } from '../../../utils/helpers';

export const submitRevisionRequest = createAsyncThunk(
  'goalRevisions/submitRevisionRequest',
  async (payload: SubmitRevisionRequestPayload, { rejectWithValue }) => {
    try {
      return await goalRevisionService.submitRevisionRequest(payload);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const fetchPendingRevisions = createAsyncThunk(
  'goalRevisions/fetchPendingRevisions',
  async (_: void, { rejectWithValue }) => {
    try {
      return await goalRevisionService.fetchPendingRevisions();
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const fetchManagerRevisionRequests = createAsyncThunk(
  'goalRevisions/fetchManagerRevisionRequests',
  async (managerId: string, { rejectWithValue }) => {
    try {
      return await goalRevisionService.fetchManagerRevisionRequests(managerId);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const approveRevision = createAsyncThunk(
  'goalRevisions/approveRevision',
  async (
    { id, ...payload }: { id: string } & ReviewRevisionPayload,
    { rejectWithValue },
  ) => {
    try {
      return await goalRevisionService.approveRevision(id, payload);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const rejectRevision = createAsyncThunk(
  'goalRevisions/rejectRevision',
  async (
    { id, ...payload }: { id: string } & ReviewRevisionPayload,
    { rejectWithValue },
  ) => {
    try {
      return await goalRevisionService.rejectRevision(id, payload);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const fetchGoalHistory = createAsyncThunk(
  'goalRevisions/fetchGoalHistory',
  async (goalId: string, { rejectWithValue }) => {
    try {
      return await goalRevisionService.fetchGoalHistory(goalId);
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);
