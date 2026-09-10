export type SelfAppraisalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';

export interface GoalSelfSummary {
  goalId: string;
  summary: string;
  evidence: string;
  selfRating: number | null;
}

export interface CompetencySelfRating {
  competencyId: string;
  rating: number | null;
  comments: string;
}

export interface SelfAppraisal {
  id: string;
  cycleId: string;
  employeeId: string;
  status: SelfAppraisalStatus;
  overallSummary: string;
  goalSummaries: GoalSelfSummary[];
  competencyRatings: CompetencySelfRating[];
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
