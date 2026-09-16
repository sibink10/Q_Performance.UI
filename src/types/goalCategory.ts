export interface GoalCategoryDto {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
}

export interface CreateGoalCategoryPayload {
  code: string;
  description: string;
  isActive: boolean;
}

export type UpdateGoalCategoryPayload = CreateGoalCategoryPayload;
