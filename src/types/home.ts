// Types for the Home dashboard. Every field here is backed by real API data;
// anything optional is hidden in the UI when the backend has no value for it.

export type HomeRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

/** OPEN → ACTIVE, DRAFT → UPCOMING, CLOSED → CLOSED (Growth Connect cycle status). */
export type CycleStatus = 'ACTIVE' | 'UPCOMING' | 'CLOSED';

export interface HomeProfile {
  name: string;
  employeeId?: string;
  roleLabel: string;
  reportingManager?: string;
  email?: string;
  phone?: string;
}

export interface ReviewCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: CycleStatus;
}

export interface CurrentReviewPeriod {
  name: string;
  /** end date of the current step (drives "days left") */
  dueDate?: string;
  daysLeft?: number;
  /** index into `steps` of the current step; steps.length means everything is done */
  currentStep: number;
  steps: string[];
}

export interface StatTileData {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone: 'primary' | 'warning' | 'info' | 'success' | 'error';
  path?: string;
}

export interface ActionItem {
  id: string;
  label: string;
  description: string;
  path: string;
}

export interface PhaseProgressDatum {
  name: string;
  done: number;
  pending: number;
}

export interface ActionRow {
  id: string;
  title: string;
  subtitle: string;
  dueLabel: string;
  urgent?: boolean;
  path: string;
}

export interface HomeData {
  profile?: HomeProfile;
  stats: StatTileData[];
  cycles: ReviewCycle[];
  quickActions: ActionItem[];
  /** employee only */
  currentPeriod?: CurrentReviewPeriod;
  goalProgress?: { completed: number; total: number; percent: number };
  /** manager / admin */
  phaseProgress?: PhaseProgressDatum[];
  needsAction: ActionRow[];
}
