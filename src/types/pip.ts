export type PipStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

export interface PipObjective {
  id: string;
  description: string;
  targetDate: string;
  isMet: boolean;
  notes: string;
}

export interface PipReviewDate {
  id: string;
  reviewDate: string;
  notes: string;
  conductedById: string;
}

export interface PerformanceImprovementPlan {
  id: string;
  cycleId: string;
  employeeId: string;
  managerId: string;
  reason: string;
  objectives: PipObjective[];
  startDate: string;
  endDate: string;
  reviewDates: PipReviewDate[];
  status: PipStatus;
  createdAt: string;
  updatedAt: string;
}
