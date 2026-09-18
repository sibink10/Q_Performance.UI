/** Category code (e.g. "ORGANIZATIONAL"). Backend-managed list, not a fixed enum — see GoalCategoryDto. */
export type GoalCategory = string;

export type GoalStatus = 'ON_TRACK' | 'NEEDS_ATTENTION' | 'OFF_TRACK' | 'COMPLETED';

export interface Goal {
  id: string;
  financialYearId: string;
  employeeId: string;
  category: GoalCategory;
  title: string;
  description: string;
  status: GoalStatus;
  startDate: string;
  targetDate: string;
  successCriteria: string;
  targetValue?: string;
  isFinalized: boolean;
  createdAt: string;
  updatedAt: string;
}
