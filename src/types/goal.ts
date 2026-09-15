export type GoalCategory = 'ORGANIZATIONAL' | 'ROLE' | 'DEVELOPMENT';

export type GoalStatus = 'ON_TRACK' | 'NEEDS_ATTENTION' | 'OFF_TRACK' | 'COMPLETED';

export interface Goal {
  id: string;
  cycleId: string;
  employeeId: string;
  category: GoalCategory;
  title: string;
  description: string;
  weight: number;
  status: GoalStatus;
  progress: number;
  startDate: string;
  targetDate: string;
  successCriteria: string;
  targetValue?: string;
  isFinalized: boolean;
  createdAt: string;
  updatedAt: string;
}
