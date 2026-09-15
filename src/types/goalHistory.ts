export type GoalHistoryAction =
  | 'Goal Created'
  | 'Revision Requested'
  | 'Revision Approved'
  | 'Revision Rejected'
  | 'Goal Updated';

export interface GoalHistoryEntry {
  id: string;
  goalId: string;
  date: string;
  action: GoalHistoryAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  requestedBy?: string;
  requestedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  comment?: string;
  revisionRequestId?: string;
}
