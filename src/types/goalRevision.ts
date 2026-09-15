import type { GoalCategory } from './goal';
import type { RevisionReasonKey } from '../utils/revisionReasonConstants';

export type GoalRevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProposedGoalChanges {
  title?: string;
  description?: string;
  targetValue?: string;
  measurementCriteria?: string;
  dueDate?: string;
  weightage?: number;
  category?: GoalCategory;
}

export interface GoalRevision {
  id: string;
  goalId: string;
  goalTitle?: string;
  employeeId: string;
  employeeName: string;

  requestedBy: string;
  requestedByName: string;
  requestedAt: string;

  reason: RevisionReasonKey;
  otherReason?: string;

  proposedChanges: ProposedGoalChanges;

  status: GoalRevisionStatus;

  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComment?: string;
}
