import { useEffect, useMemo } from 'react';
import type { GoalHistoryAction, GoalHistoryEntry } from '../../../types/goalHistory';
import { REVISION_FIELD_LABELS } from '../../../utils/goalRevisionFieldLabels';
import Timeline, { type TimelineEntry, type TimelineTone } from '../../common/Timeline';
import useGoalRevisions from '../../../hooks/useGoalRevisions';

const ACTION_TONE: Record<GoalHistoryAction, TimelineTone> = {
  'Goal Created': 'default',
  'Revision Requested': 'warning',
  'Revision Approved': 'success',
  'Revision Rejected': 'error',
  'Goal Updated': 'info',
};

function toTimelineEntry(entry: GoalHistoryEntry): TimelineEntry {
  const meta: TimelineEntry['meta'] = [];

  if (entry.field) {
    meta.push({
      label: REVISION_FIELD_LABELS[entry.field] ?? entry.field,
      value: `${entry.oldValue || '—'} → ${entry.newValue || '—'}`,
    });
  }

  let subtitle: string | undefined;
  let description: string | undefined;

  switch (entry.action) {
    case 'Revision Requested':
      subtitle = entry.requestedByName ? `Requested by ${entry.requestedByName}` : undefined;
      description = entry.reason ? `Reason: ${entry.reason}` : undefined;
      break;
    case 'Revision Approved':
      subtitle = entry.approvedByName ? `Approved by ${entry.approvedByName}` : undefined;
      description = entry.comment ? `Comment: ${entry.comment}` : undefined;
      break;
    case 'Revision Rejected':
      subtitle = entry.approvedByName ? `Rejected by ${entry.approvedByName}` : undefined;
      description = entry.comment ? `Comment: ${entry.comment}` : undefined;
      break;
    default:
      break;
  }

  return {
    id: entry.id,
    date: entry.date,
    title: entry.action,
    subtitle,
    description,
    meta,
    tone: ACTION_TONE[entry.action],
  };
}

type GoalHistoryTimelineProps = {
  goalId: string;
};

/** Read-only audit trail for a single goal — Created / Requested / Approved / Rejected / Updated. */
const GoalHistoryTimeline = ({ goalId }: GoalHistoryTimelineProps) => {
  const { goalHistory, getGoalHistory, isLoading } = useGoalRevisions();

  useEffect(() => {
    getGoalHistory(goalId);
  }, [getGoalHistory, goalId]);

  const entries = useMemo(
    () =>
      goalHistory
        .filter((entry) => entry.goalId === goalId)
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(toTimelineEntry),
    [goalHistory, goalId],
  );

  if (isLoading && !entries.length) {
    return null;
  }

  return <Timeline entries={entries} emptyMessage="No revision history for this goal yet." />;
};

export default GoalHistoryTimeline;
