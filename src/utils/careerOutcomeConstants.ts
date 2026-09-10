export const CAREER_OUTCOME = {
  PROMOTION: 'PROMOTION',
  LATERAL_MOVE: 'LATERAL_MOVE',
  STAY_AND_GROW: 'STAY_AND_GROW',
  ROLE_EXPANSION: 'ROLE_EXPANSION',
  PIP: 'PIP',
  EXIT: 'EXIT',
} as const;

export type CareerOutcomeKey = (typeof CAREER_OUTCOME)[keyof typeof CAREER_OUTCOME];

export const CAREER_OUTCOME_LABELS: Record<CareerOutcomeKey, string> = {
  [CAREER_OUTCOME.PROMOTION]: 'Promotion Ready',
  [CAREER_OUTCOME.LATERAL_MOVE]: 'Lateral Move',
  [CAREER_OUTCOME.STAY_AND_GROW]: 'Stay & Grow',
  [CAREER_OUTCOME.ROLE_EXPANSION]: 'Role Expansion',
  [CAREER_OUTCOME.PIP]: 'Performance Improvement Plan',
  [CAREER_OUTCOME.EXIT]: 'Exit / Separation',
};
