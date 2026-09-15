import type { Theme } from '@mui/material/styles';
import type { PaletteColor } from '@mui/material/styles';
import type { GoalStatus } from '../types/goal';
import type { CycleStageStatus } from '../types/performanceCycle';
import type { GoalRevisionStatus } from '../types/goalRevision';
import type { CalibrationStatus } from '../types/calibration';
import { GOAL_STATUS } from './goalConstants';
import { FINAL_RATING, type FinalRatingKey } from './ratingScaleConstants';

export type StatusColorSet = Pick<PaletteColor, 'main' | 'light' | 'dark' | 'contrastText'>;

function toColorSet(color: PaletteColor): StatusColorSet {
  return {
    main: color.main,
    light: color.light,
    dark: color.dark,
    contrastText: color.contrastText,
  };
}

export const GOAL_STATUS_PALETTE_KEY: Record<GoalStatus, keyof Theme['palette']> = {
  [GOAL_STATUS.ON_TRACK]: 'onTrack',
  [GOAL_STATUS.NEEDS_ATTENTION]: 'needsAttention',
  [GOAL_STATUS.OFF_TRACK]: 'offTrack',
  [GOAL_STATUS.COMPLETED]: 'completed',
};

export const FINAL_RATING_PALETTE_KEY: Record<
  FinalRatingKey,
  keyof Theme['palette']['ratingScale']
> = {
  [FINAL_RATING.EXCEPTIONAL]: 'exceptional',
  [FINAL_RATING.EXCEEDS_EXPECTATIONS]: 'exceedsExpectations',
  [FINAL_RATING.MEETS_EXPECTATIONS]: 'meetsExpectations',
  [FINAL_RATING.NEEDS_IMPROVEMENT]: 'needsImprovement',
  [FINAL_RATING.UNSATISFACTORY]: 'unsatisfactory',
};

export const CYCLE_STAGE_STATUS_PALETTE_KEY: Record<
  CycleStageStatus,
  'default' | 'info' | 'success' | 'warning'
> = {
  UPCOMING: 'default',
  ACTIVE: 'info',
  COMPLETED: 'success',
  LOCKED: 'warning',
};

export const GOAL_REVISION_STATUS_PALETTE_KEY: Record<
  GoalRevisionStatus,
  'warning' | 'success' | 'error'
> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

export const GOAL_REVISION_STATUS_LABELS: Record<GoalRevisionStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const CALIBRATION_STATUS_PALETTE_KEY: Record<
  CalibrationStatus,
  'default' | 'info' | 'warning' | 'success'
> = {
  PENDING: 'default',
  IN_REVIEW: 'info',
  CALIBRATED: 'warning',
  FINALIZED: 'success',
};

export function getGoalStatusColors(theme: Theme, status: GoalStatus): StatusColorSet {
  const key = GOAL_STATUS_PALETTE_KEY[status];
  return toColorSet(theme.palette[key] as PaletteColor);
}

export function getFinalRatingColors(theme: Theme, rating: FinalRatingKey): StatusColorSet {
  const key = FINAL_RATING_PALETTE_KEY[rating];
  return toColorSet(theme.palette.ratingScale[key]);
}

export function getCycleStageStatusColor(
  theme: Theme,
  status: CycleStageStatus,
): StatusColorSet {
  const key = CYCLE_STAGE_STATUS_PALETTE_KEY[status];
  return toColorSet(theme.palette[key]);
}

export function getGoalRevisionStatusColor(
  theme: Theme,
  status: GoalRevisionStatus,
): StatusColorSet {
  const key = GOAL_REVISION_STATUS_PALETTE_KEY[status];
  return toColorSet(theme.palette[key]);
}

export function getCalibrationStatusColor(
  theme: Theme,
  status: CalibrationStatus,
): StatusColorSet {
  const key = CALIBRATION_STATUS_PALETTE_KEY[status];
  return toColorSet(theme.palette[key]);
}
