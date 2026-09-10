import type { RevisionReasonKey } from '../utils/revisionReasonConstants';

export type GoalRevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface GoalRevision {
  id: string;
  goalId: string;
  cycleId: string;
  employeeId: string;
  managerId: string;
  requestedChanges: string;
  reason: RevisionReasonKey;
  reasonNotes: string;
  status: GoalRevisionStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewNotes: string | null;
}
