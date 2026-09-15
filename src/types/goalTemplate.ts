import type { GoalCategory } from './goal';

export interface GoalTemplate {
  id: string;
  category: GoalCategory;
  title: string;
  description: string;
  successCriteria: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
}
