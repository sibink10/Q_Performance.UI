import type { UserRole } from './user';

export interface GoalComment {
  id: string;
  goalId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}
