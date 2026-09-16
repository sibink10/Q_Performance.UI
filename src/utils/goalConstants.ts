import type { GoalCategory, GoalStatus } from '../types/goal';

export const GOAL_STATUS = {
  ON_TRACK: 'ON_TRACK',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  OFF_TRACK: 'OFF_TRACK',
  COMPLETED: 'COMPLETED',
} as const satisfies Record<string, GoalStatus>;

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  [GOAL_STATUS.ON_TRACK]: 'On Track',
  [GOAL_STATUS.NEEDS_ATTENTION]: 'Needs Attention',
  [GOAL_STATUS.OFF_TRACK]: 'Off Track',
  [GOAL_STATUS.COMPLETED]: 'Completed',
};

export const GOAL_CATEGORY = {
  ORGANIZATIONAL: 'ORGANIZATIONAL',
  ROLE: 'ROLE',
  DEVELOPMENT: 'DEVELOPMENT',
} as const satisfies Record<string, GoalCategory>;

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  [GOAL_CATEGORY.ORGANIZATIONAL]: 'Organizational',
  [GOAL_CATEGORY.ROLE]: 'Role',
  [GOAL_CATEGORY.DEVELOPMENT]: 'Development',
};

/**
 * Category codes are stored upper case (e.g. "ORGANIZATIONAL"). For display, use the
 * curated label above when known, otherwise auto-format: first letter capitalized, the
 * rest lower case (e.g. "SOME_CATEGORY" -> "Some category").
 */
export function formatCategoryLabel(code: string): string {
  if (!code) return '';
  if (GOAL_CATEGORY_LABELS[code]) return GOAL_CATEGORY_LABELS[code];

  const normalized = code.toLowerCase().replace(/_/g, ' ').trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
