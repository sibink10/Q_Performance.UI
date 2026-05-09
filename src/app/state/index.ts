// @ts-nocheck
// src/app/state/index.js
// Central Redux store - combines all slices for the QHRMS application

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import performanceReducer from './slices/performanceSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    performance: performanceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore date objects in performance state
        ignoredPaths: ['performance.appraisalCycles'],
      },
    }),
});

export default store;
