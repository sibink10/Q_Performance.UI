// @ts-nocheck
// src/routes/AppRoutes
// Central routing configuration for the QHRMS Performance module
// Public: /login
// Protected Employee: /performance/*
// Protected Admin (Config): /config/performance/*
// Protected Admin (Operations): /operations/performance/*

import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthGuard from '../guards/AuthGuard';
import EmployeeGuard from '../guards/EmployeeGuard';
import AdminGuard from '../guards/AdminGuard';

// ── Auth ──────────────────────────────────────────────────────────────────────
import Login from '../pages/auth/Login';

// ── Config Module (Admin Only) ────────────────────────────────────────────────
import FinancialYearConfig from '../pages/config/FinancialYearConfig';
import AppraisalConfig from '../pages/config/AppraisalConfig';
import FocusAreas from '../pages/config/FocusAreas';
import ReviewFormDesign from '../pages/config/ReviewFormDesign';

// ── Operations Module (Admin Only) ────────────────────────────────────────────
import OperationsPerformance from '../pages/operations/OperationsPerformance';
import AssignReviewForm from '../pages/operations/AssignReviewForm';
import AssignedReviewFormsList from '../pages/operations/AssignedReviewFormsList';
import AssignedReviewFormEmployees from '../pages/operations/AssignedReviewFormEmployees';

// ── Employee Module (All Users) ───────────────────────────────────────────────
import EmployeePerformance from '../pages/employee/EmployeePerformance';
import SelfEvaluationForm from '../pages/employee/SelfEvaluationForm';
import MyResults from '../pages/employee/MyResults';

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/login" element={<Login />} />

    {/* Protected Routes — All Authenticated Users */}
    <Route
      path="/"
      element={
        <AuthGuard>
          <MainLayout />
        </AuthGuard>
      }
    >
      {/* Default redirect */}
      <Route index element={<Navigate to="/performance" replace />} />

      {/* Employee Performance Module */}
      <Route path="performance">
        <Route index element={<EmployeeGuard><EmployeePerformance /></EmployeeGuard>} />
        <Route path="review/:reviewId" element={<EmployeeGuard><SelfEvaluationForm /></EmployeeGuard>} />
        <Route path="results" element={<EmployeeGuard><MyResults /></EmployeeGuard>} />
        <Route path="results/:assignmentId" element={<EmployeeGuard><MyResults /></EmployeeGuard>} />
      </Route>

      {/* Operations Module — Admin Only */}
      <Route
        path="operations/performance"
        element={<AdminGuard><OperationsPerformance /></AdminGuard>}
      />
      <Route
        path="operations/performance/assign"
        element={<AdminGuard><AssignReviewForm /></AdminGuard>}
      />
      <Route
        path="operations/performance/assignments"
        element={<AdminGuard><AssignedReviewFormsList /></AdminGuard>}
      />
      <Route
        path="operations/performance/assignments/employees"
        element={<AdminGuard><AssignedReviewFormEmployees /></AdminGuard>}
      />

      {/* Config Module — Admin Only */}
      <Route path="config/performance" element={<Navigate to="/config/performance/appraisal-config" replace />} />
      <Route
        path="config/performance/financial-years"
        element={<AdminGuard><FinancialYearConfig /></AdminGuard>}
      />
      <Route
        path="config/performance/appraisal-config"
        element={<AdminGuard><AppraisalConfig /></AdminGuard>}
      />
      <Route
        path="config/performance/focus-areas"
        element={<AdminGuard><FocusAreas /></AdminGuard>}
      />
      <Route
        path="config/performance/review-forms"
        element={<AdminGuard><ReviewFormDesign /></AdminGuard>}
      />
      <Route
        path="config/performance/review-forms/:formId"
        element={<AdminGuard><ReviewFormDesign /></AdminGuard>}
      />
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/performance" replace />} />
  </Routes>
);

export default AppRoutes;
