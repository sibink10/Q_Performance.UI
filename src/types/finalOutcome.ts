import type { FinalRatingKey } from '../utils/ratingScaleConstants';
import type { CareerOutcomeKey } from '../utils/careerOutcomeConstants';

export type FinalOutcomeStatus = 'DRAFT' | 'PENDING_HR' | 'PUBLISHED';

export interface FinalOutcome {
  id: string;
  cycleId: string;
  employeeId: string;
  finalRating: FinalRatingKey | null;
  careerOutcomeId: string | null;
  careerOutcomeType: CareerOutcomeKey | null;
  developmentPlanId: string | null;
  pipId: string | null;
  status: FinalOutcomeStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
