import type { ProposedGoalChanges } from '../types/goalRevision';
import { formatDateOnly } from './helpers';

/** Covers both ProposedGoalChanges keys (manager-facing) and Goal field keys (audit-facing). */
export const REVISION_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  targetValue: 'Target',
  measurementCriteria: 'Measurement Criteria',
  successCriteria: 'Measurement Criteria',
  dueDate: 'Due Date',
  targetDate: 'Due Date',
  category: 'Category',
};

export type FormattedField = { field: string; label: string; value: string };

export function formatProposedChanges(changes: ProposedGoalChanges): FormattedField[] {
  return Object.entries(changes)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([field, value]) => ({
      field,
      label: REVISION_FIELD_LABELS[field] ?? field,
      value: field === 'dueDate' ? formatDateOnly(value as string) : String(value),
    }));
}
