import type { GoalCategory } from './goal';

export interface GoalTemplate {
  id: string;
  categoryId: string;
  category: GoalCategory;
  title: string;
  description: string;
  successCriteria: string;
  createdAt: string;
  updatedAt: string;
}
