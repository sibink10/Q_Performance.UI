import type { GoalHistoryEntry } from '../../../types/goalHistory';

/**
 * Append-only goal audit trail, keyed by goalId. Each entry captures the actor's
 * name at the time of the event (not dynamically joined), matching real audit-log semantics.
 */
export const mockGoalHistory: Record<string, GoalHistoryEntry[]> = {
  // Pending revision — Created → Requested only.
  'goal-006-1': [
    {
      id: 'hist-006-1-1',
      goalId: 'goal-006-1',
      date: '2026-04-01T00:00:00.000Z',
      action: 'Goal Created',
    },
    {
      id: 'hist-006-1-2',
      goalId: 'goal-006-1',
      date: '2026-09-10T09:15:00.000Z',
      action: 'Revision Requested',
      reason: 'Business Priority Changed',
      requestedBy: 'usr-003',
      requestedByName: 'Anita Desai',
      field: 'measurementCriteria',
      oldValue: 'Achieve CSAT ≥ 4.5/5 for Q3–Q4 measured via quarterly survey.',
      newValue:
        'Achieve CSAT ≥ 4.2/5 for Q3–Q4 measured via quarterly survey, adjusted for reduced support headcount.',
      revisionRequestId: 'rev-001',
    },
  ],

  'goal-010-2': [
    {
      id: 'hist-010-2-1',
      goalId: 'goal-010-2',
      date: '2026-04-01T00:00:00.000Z',
      action: 'Goal Created',
    },
    {
      id: 'hist-010-2-2',
      goalId: 'goal-010-2',
      date: '2026-09-11T11:30:00.000Z',
      action: 'Revision Requested',
      reason: 'Goal Already Achieved',
      requestedBy: 'usr-004',
      requestedByName: 'Vikram Singh',
      field: 'dueDate',
      oldValue: '2027-03-15',
      newValue: '2026-12-01',
      revisionRequestId: 'rev-002',
    },
  ],

  'goal-017-1': [
    {
      id: 'hist-017-1-1',
      goalId: 'goal-017-1',
      date: '2026-04-01T00:00:00.000Z',
      action: 'Goal Created',
    },
    {
      id: 'hist-017-1-2',
      goalId: 'goal-017-1',
      date: '2026-09-12T14:00:00.000Z',
      action: 'Revision Requested',
      reason: 'Other',
      requestedBy: 'usr-016',
      requestedByName: 'Harish Pillai',
      field: 'weightage',
      oldValue: '25',
      newValue: '30',
      revisionRequestId: 'rev-003',
    },
  ],

  // Approved revision — Created → Requested → Approved → Updated.
  'goal-007-1': [
    {
      id: 'hist-007-1-1',
      goalId: 'goal-007-1',
      date: '2026-04-01T00:00:00.000Z',
      action: 'Goal Created',
    },
    {
      id: 'hist-007-1-2',
      goalId: 'goal-007-1',
      date: '2026-08-20T10:00:00.000Z',
      action: 'Revision Requested',
      reason: 'Project Changed',
      requestedBy: 'usr-003',
      requestedByName: 'Anita Desai',
      field: 'dueDate',
      oldValue: '2027-03-15',
      newValue: '2027-01-31',
      revisionRequestId: 'rev-004',
    },
    {
      id: 'hist-007-1-3',
      goalId: 'goal-007-1',
      date: '2026-08-22T15:00:00.000Z',
      action: 'Revision Approved',
      approvedBy: 'usr-001',
      approvedByName: 'Priya Sharma',
      comment: 'Approved based on the updated project delivery timeline.',
      revisionRequestId: 'rev-004',
    },
    {
      id: 'hist-007-1-4',
      goalId: 'goal-007-1',
      date: '2026-08-22T15:00:00.000Z',
      action: 'Goal Updated',
      field: 'dueDate',
      oldValue: '2027-03-15',
      newValue: '2027-01-31',
      revisionRequestId: 'rev-004',
    },
  ],

  'goal-011-1': [
    {
      id: 'hist-011-1-1',
      goalId: 'goal-011-1',
      date: '2026-04-01T00:00:00.000Z',
      action: 'Goal Created',
    },
    {
      id: 'hist-011-1-2',
      goalId: 'goal-011-1',
      date: '2026-08-25T09:00:00.000Z',
      action: 'Revision Requested',
      reason: 'New Responsibility Assigned',
      requestedBy: 'usr-004',
      requestedByName: 'Vikram Singh',
      field: 'weightage',
      oldValue: '25',
      newValue: '15',
      revisionRequestId: 'rev-005',
    },
    {
      id: 'hist-011-1-3',
      goalId: 'goal-011-1',
      date: '2026-08-27T13:00:00.000Z',
      action: 'Revision Approved',
      approvedBy: 'usr-001',
      approvedByName: 'Priya Sharma',
      comment: 'Approved — reduced weight reflects reassigned capacity.',
      revisionRequestId: 'rev-005',
    },
    {
      id: 'hist-011-1-4',
      goalId: 'goal-011-1',
      date: '2026-08-27T13:00:00.000Z',
      action: 'Goal Updated',
      field: 'weightage',
      oldValue: '25',
      newValue: '15',
      revisionRequestId: 'rev-005',
    },
    {
      id: 'hist-011-1-5',
      goalId: 'goal-011-1',
      date: '2026-08-27T13:00:00.000Z',
      action: 'Goal Updated',
      field: 'description',
      oldValue: 'Drive CSAT improvements through faster resolution and proactive communication.',
      newValue:
        'Drive CSAT improvements through faster resolution and proactive communication, scoped down to reflect newly assigned onboarding responsibilities.',
      revisionRequestId: 'rev-005',
    },
  ],

  // Rejected revision — Created → Requested → Rejected. Goal remains unchanged.
  'goal-008-2': [
    {
      id: 'hist-008-2-1',
      goalId: 'goal-008-2',
      date: '2026-04-01T00:00:00.000Z',
      action: 'Goal Created',
    },
    {
      id: 'hist-008-2-2',
      goalId: 'goal-008-2',
      date: '2026-09-02T09:00:00.000Z',
      action: 'Revision Requested',
      reason: 'Goal Already Achieved',
      requestedBy: 'usr-003',
      requestedByName: 'Anita Desai',
      field: 'weightage',
      oldValue: '25',
      newValue: '10',
      revisionRequestId: 'rev-006',
    },
    {
      id: 'hist-008-2-3',
      goalId: 'goal-008-2',
      date: '2026-09-04T10:00:00.000Z',
      action: 'Revision Rejected',
      approvedBy: 'usr-001',
      approvedByName: 'Priya Sharma',
      comment:
        'Insufficient evidence provided that the goal has been achieved; please resubmit with supporting data.',
      revisionRequestId: 'rev-006',
    },
  ],

  'goal-013-1': [
    {
      id: 'hist-013-1-1',
      goalId: 'goal-013-1',
      date: '2026-04-01T00:00:00.000Z',
      action: 'Goal Created',
    },
    {
      id: 'hist-013-1-2',
      goalId: 'goal-013-1',
      date: '2026-09-05T09:00:00.000Z',
      action: 'Revision Requested',
      reason: 'Project Changed',
      requestedBy: 'usr-005',
      requestedByName: 'Meera Patel',
      field: 'dueDate',
      oldValue: '2027-03-15',
      newValue: '2027-02-28',
      revisionRequestId: 'rev-007',
    },
    {
      id: 'hist-013-1-3',
      goalId: 'goal-013-1',
      date: '2026-09-07T11:00:00.000Z',
      action: 'Revision Rejected',
      approvedBy: 'usr-001',
      approvedByName: 'Priya Sharma',
      comment: 'Project change is not yet finalized; resubmit once confirmed by the PMO.',
      revisionRequestId: 'rev-007',
    },
  ],
};
