import type { GoalRevision } from '../../../types/goalRevision';
import { REVISION_REASON } from '../../../utils/revisionReasonConstants';

/**
 * Seed revision requests. Only ids are stored here — employeeName/requestedByName/
 * reviewedByName are attached at read time by goalRevisionService via getMockUserById.
 */
export const mockGoalRevisions: GoalRevision[] = [
  // ── Pending ──────────────────────────────────────────────────────────────
  {
    id: 'rev-001',
    goalId: 'goal-006-1',
    employeeId: 'usr-006',
    employeeName: '',
    requestedBy: 'usr-003',
    requestedByName: '',
    requestedAt: '2026-09-10T09:15:00.000Z',
    reason: REVISION_REASON.BUSINESS_PRIORITY_CHANGED,
    proposedChanges: {
      targetValue: 'CSAT ≥ 4.2/5',
      measurementCriteria:
        'Achieve CSAT ≥ 4.2/5 for Q3–Q4 measured via quarterly survey, adjusted for reduced support headcount.',
    },
    status: 'PENDING',
  },
  {
    id: 'rev-002',
    goalId: 'goal-010-2',
    employeeId: 'usr-010',
    employeeName: '',
    requestedBy: 'usr-004',
    requestedByName: '',
    requestedAt: '2026-09-11T11:30:00.000Z',
    reason: REVISION_REASON.GOAL_ALREADY_ACHIEVED,
    proposedChanges: {
      dueDate: '2026-12-01',
      measurementCriteria:
        'Rework rate already reduced by 15% as of Q2; extend target to 20% reduction for the remainder of the cycle.',
    },
    status: 'PENDING',
  },
  {
    id: 'rev-003',
    goalId: 'goal-017-1',
    employeeId: 'usr-017',
    employeeName: '',
    requestedBy: 'usr-016',
    requestedByName: '',
    requestedAt: '2026-09-12T14:00:00.000Z',
    reason: REVISION_REASON.OTHER,
    otherReason:
      'Team restructuring merged the onboarding and support specialist roles; goal scope needs to widen to cover both.',
    proposedChanges: {
      description:
        'Drive CSAT improvements through faster resolution and proactive communication across the combined onboarding and support queues.',
      weightage: 30,
    },
    status: 'PENDING',
  },

  // ── Approved ─────────────────────────────────────────────────────────────
  {
    id: 'rev-004',
    goalId: 'goal-007-1',
    employeeId: 'usr-007',
    employeeName: '',
    requestedBy: 'usr-003',
    requestedByName: '',
    requestedAt: '2026-08-20T10:00:00.000Z',
    reason: REVISION_REASON.PROJECT_CHANGED,
    proposedChanges: {
      dueDate: '2027-01-31',
    },
    status: 'APPROVED',
    reviewedBy: 'usr-001',
    reviewedByName: '',
    reviewedAt: '2026-08-22T15:00:00.000Z',
    reviewComment: 'Approved based on the updated project delivery timeline.',
  },
  {
    id: 'rev-005',
    goalId: 'goal-011-1',
    employeeId: 'usr-011',
    employeeName: '',
    requestedBy: 'usr-004',
    requestedByName: '',
    requestedAt: '2026-08-25T09:00:00.000Z',
    reason: REVISION_REASON.NEW_RESPONSIBILITY_ASSIGNED,
    proposedChanges: {
      weightage: 15,
      description:
        'Drive CSAT improvements through faster resolution and proactive communication, scoped down to reflect newly assigned onboarding responsibilities.',
    },
    status: 'APPROVED',
    reviewedBy: 'usr-001',
    reviewedByName: '',
    reviewedAt: '2026-08-27T13:00:00.000Z',
    reviewComment: 'Approved — reduced weight reflects reassigned capacity.',
  },

  // ── Rejected ─────────────────────────────────────────────────────────────
  {
    id: 'rev-006',
    goalId: 'goal-008-2',
    employeeId: 'usr-008',
    employeeName: '',
    requestedBy: 'usr-003',
    requestedByName: '',
    requestedAt: '2026-09-02T09:00:00.000Z',
    reason: REVISION_REASON.GOAL_ALREADY_ACHIEVED,
    proposedChanges: {
      weightage: 10,
    },
    status: 'REJECTED',
    reviewedBy: 'usr-001',
    reviewedByName: '',
    reviewedAt: '2026-09-04T10:00:00.000Z',
    reviewComment:
      'Insufficient evidence provided that the goal has been achieved; please resubmit with supporting data.',
  },
  {
    id: 'rev-007',
    goalId: 'goal-013-1',
    employeeId: 'usr-013',
    employeeName: '',
    requestedBy: 'usr-005',
    requestedByName: '',
    requestedAt: '2026-09-05T09:00:00.000Z',
    reason: REVISION_REASON.PROJECT_CHANGED,
    proposedChanges: {
      dueDate: '2027-02-28',
    },
    status: 'REJECTED',
    reviewedBy: 'usr-001',
    reviewedByName: '',
    reviewedAt: '2026-09-07T11:00:00.000Z',
    reviewComment: 'Project change is not yet finalized; resubmit once confirmed by the PMO.',
  },
];
