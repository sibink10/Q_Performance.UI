// @ts-nocheck
// src/app/state/index.js
// Central Redux store - combines all slices for the QHRMS application

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import performanceReducer from './slices/performanceSlice';
import orgBrandingReducer from './slices/orgBrandingSlice';
import performanceCycleReducer from './slices/performanceCycleSlice';
import goalsReducer from './slices/goalsSlice';
import goalRevisionsReducer from './slices/goalRevisionSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    performance: performanceReducer,
    orgBranding: orgBrandingReducer,
    performanceCycle: performanceCycleReducer,
    goals: goalsReducer,
    goalRevisions: goalRevisionsReducer,
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
