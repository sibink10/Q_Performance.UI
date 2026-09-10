import type { FinalRatingKey } from '../utils/ratingScaleConstants';

export type ManagerAssessmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';

export type RatingRevisionRequestStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface GoalManagerRating {
  goalId: string;
  rating: number | null;
  comments: string;
}

export interface CompetencyManagerRating {
  competencyId: string;
  rating: number | null;
  comments: string;
}

export interface RatingRevisionRequest {
  id: string;
  assessmentId: string;
  requestedRating: FinalRatingKey;
  reason: string;
  status: RatingRevisionRequestStatus;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewNotes: string | null;
}

export interface ManagerAssessment {
  id: string;
  cycleId: string;
  employeeId: string;
  managerId: string;
  status: ManagerAssessmentStatus;
  goalRatings: GoalManagerRating[];
  competencyRatings: CompetencyManagerRating[];
  overallRating: FinalRatingKey | null;
  overallComments: string;
  ratingRevisionRequest: RatingRevisionRequest | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
