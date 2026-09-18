import type { GoalStatus } from './goal';
import type { RevisionReasonKey } from '../utils/revisionReasonConstants';

export type GrowthConnectRevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Covers only the manager's own status/feedback for a cycle entry — the employee's update has no revision path. */
export interface GrowthConnectRevision {
  id: string;
  entryId: string;
  goalId: string;
  goalTitle: string;
  cycleId: string;
  cycleName: string;
  employeeId: string;
  employeeName: string;

  requestedBy: string;
  requestedByName: string;
  requestedAt: string;

  reason: RevisionReasonKey;
  otherReason?: string;

  proposedManagerStatus?: GoalStatus;
  proposedManagerFeedback?: string;

  status: GrowthConnectRevisionStatus;

  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComment?: string;
}
