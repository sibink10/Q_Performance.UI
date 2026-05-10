// @ts-nocheck
// src/app/state/index.js
// Central Redux store - combines all slices for the QHRMS application

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import performanceReducer from './slices/performanceSlice';
import orgBrandingReducer from './slices/orgBrandingSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    performance: performanceReducer,
    orgBranding: orgBrandingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore date objects in performance state
        ignoredPaths: ['performance.appraisalCycles'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
