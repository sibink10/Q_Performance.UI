import type { CareerOutcomeKey } from '../utils/careerOutcomeConstants';

export type CareerRecommendationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

export interface CareerRecommendation {
  id: string;
  cycleId: string;
  employeeId: string;
  recommendedById: string;
  outcomeType: CareerOutcomeKey;
  rationale: string;
  targetRole: string | null;
  targetTimeline: string | null;
  status: CareerRecommendationStatus;
  createdAt: string;
  updatedAt: string;
}
