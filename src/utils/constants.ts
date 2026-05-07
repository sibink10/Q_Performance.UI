// @ts-nocheck
// src/utils/constants.js
// Application-wide constants for the Performance module

export const RATING_SCALES = {
  FOUR_POINT: { value: 4, label: '4-Point Scale', options: [1, 2, 3, 4] },
  FIVE_POINT: { value: 5, label: '5-Point Scale', options: [1, 2, 3, 4, 5] },
  TEN_POINT: { value: 10, label: '10-Point Scale', options: [1,2,3,4,5,6,7,8,9,10] },
};

export const WEIGHTAGE_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export const APPRAISAL_CYCLE_TYPES = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
];

export const APPRAISAL_START_MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const EVALUATION_PHASES = {
  SELF: 'self_evaluation',
  MANAGER: 'manager_evaluation',
  HR: 'hr_review',
  PUBLISHED: 'published',
};

export const PHASE_LABELS = {
  [EVALUATION_PHASES.SELF]: 'Self Evaluation',
  [EVALUATION_PHASES.MANAGER]: 'Manager Evaluation',
  [EVALUATION_PHASES.HR]: 'HR/Admin Review',
  [EVALUATION_PHASES.PUBLISHED]: 'Rating Published',
};

export const REVIEW_STATUSES = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  DRAFT_SAVED: 'Draft Saved',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
};

export const STATUS_COLORS = {
  [REVIEW_STATUSES.NOT_STARTED]: 'default',
  [REVIEW_STATUSES.IN_PROGRESS]: 'warning',
  [REVIEW_STATUSES.DRAFT_SAVED]: 'info',
  [REVIEW_STATUSES.SUBMITTED]: 'success',
  [REVIEW_STATUSES.COMPLETED]: 'success',
};

export const FINANCIAL_YEARS = (() => {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    years.push({ value: `${y}-${y + 1}`, label: `FY ${y}-${y + 1}` });
  }
  return years;
})();

export const FOCUS_AREA_SUGGESTIONS = [
  'Technical Skills',
  'Communication',
  'Leadership',
  'Productivity',
  'Customer Focus',
  'Problem Solving',
  'Teamwork',
  'Innovation',
  'Time Management',
  'Adaptability',
];

export const NORMALIZATION_TYPES = [
  { value: 'SUGGESTIVE', label: 'Suggestive (HR decides)' },
  { value: 'ENFORCED', label: 'Enforced (System enforces limits)' },
];

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
};
