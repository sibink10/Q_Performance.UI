import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import performanceService from '../../../services/performanceService';
import type { OrgBranding, OrgBrandingPatch, OrgBrandingUploadKind } from '../../../types/orgBranding';
import { mergeOrgBranding } from '../../../utils/orgBrandingDefaults';
import { getApiErrorMessage } from '../../../utils/helpers';
import { clearAuth } from './authSlice';

type FetchStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
type UpdateStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

const ASSET_FIELD: Record<OrgBrandingUploadKind, keyof OrgBranding> = {
  logo: 'logoUrl',
  companyLogo: 'companyLogoUrl',
  loginLogo: 'loginLogoUrl',
  favicon: 'faviconUrl',
  banner: 'bannerUrl',
};

export type OrgBrandingState = {
  remote: Partial<OrgBranding> | null;
  fetchStatus: FetchStatus;
  updateStatus: UpdateStatus;
  uploadStatus: 'idle' | 'loading' | 'failed';
  uploadError: string | null;
  fetchError: string | null;
  updateError: string | null;
};

const initialState: OrgBrandingState = {
  remote: null,
  fetchStatus: 'idle',
  updateStatus: 'idle',
  uploadStatus: 'idle',
  uploadError: null,
  fetchError: null,
  updateError: null,
};

type AuthTokenState = { auth: { token: string | null } };

export const fetchOrgBranding = createAsyncThunk(
  'orgBranding/fetch',
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as AuthTokenState).auth?.token;
    if (!token) {
      return rejectWithValue('Not authenticated');
    }
    try {
      const data = await performanceService.getOrgBranding();
      return (data || {}) as Partial<OrgBranding>;
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const updateOrgBranding = createAsyncThunk(
  'orgBranding/update',
  async (patch: OrgBrandingPatch, { rejectWithValue }) => {
    try {
      const data = await performanceService.updateOrgBranding(patch);
      return (data ?? patch) as Partial<OrgBranding>;
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

export const uploadOrgBrandingAsset = createAsyncThunk(
  'orgBranding/uploadAsset',
  async (
    { file, kind }: { file: File; kind: OrgBrandingUploadKind },
    { rejectWithValue },
  ) => {
    try {
      const raw = await performanceService.uploadOrgBrandingAsset(file, kind);
      const url =
        typeof raw?.url === 'string'
          ? raw.url
          : typeof raw === 'string'
            ? raw
            : null;
      if (!url) {
        return rejectWithValue('Upload response did not include a file URL');
      }
      return { url, kind } as { url: string; kind: OrgBrandingUploadKind };
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e));
    }
  },
);

const orgBrandingSlice = createSlice({
  name: 'orgBranding',
  initialState,
  reducers: {
    resetOrgBrandingState: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder.addCase(clearAuth, () => ({ ...initialState }));

    builder
      .addCase(fetchOrgBranding.pending, (state) => {
        state.fetchStatus = 'loading';
        state.fetchError = null;
      })
      .addCase(fetchOrgBranding.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.remote = action.payload;
        state.fetchError = null;
      })
      .addCase(fetchOrgBranding.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.fetchError =
          typeof action.payload === 'string' ? action.payload : action.error?.message || 'Failed to load branding';
      });

    builder
      .addCase(updateOrgBranding.pending, (state) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updateOrgBranding.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.remote = {
          ...(state.remote || {}),
          ...action.payload,
        };
        state.updateError = null;
      })
      .addCase(updateOrgBranding.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError =
          typeof action.payload === 'string' ? action.payload : action.error?.message || 'Failed to save';
      });

    builder
      .addCase(uploadOrgBrandingAsset.pending, (state) => {
        state.uploadStatus = 'loading';
        state.uploadError = null;
      })
      .addCase(uploadOrgBrandingAsset.fulfilled, (state, action) => {
        state.uploadStatus = 'idle';
        const { url, kind } = action.payload;
        const field = ASSET_FIELD[kind];
        if (!state.remote) state.remote = {};
        state.remote[field] = url;
        state.uploadError = null;
      })
      .addCase(uploadOrgBrandingAsset.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.uploadError =
          typeof action.payload === 'string' ? action.payload : action.error?.message || 'Upload failed';
      });
  },
});

export const { resetOrgBrandingState } = orgBrandingSlice.actions;

type OrgBrandingRoot = { orgBranding: OrgBrandingState };

export const selectOrgBrandingRemote = (state: OrgBrandingRoot) => state.orgBranding.remote;
export const selectOrgBranding = (state: OrgBrandingRoot) =>
  mergeOrgBranding(state.orgBranding.remote);
export const selectOrgBrandingFetchStatus = (state: OrgBrandingRoot) =>
  state.orgBranding.fetchStatus;
export const selectOrgBrandingUpdateStatus = (state: OrgBrandingRoot) =>
  state.orgBranding.updateStatus;

export default orgBrandingSlice.reducer;
