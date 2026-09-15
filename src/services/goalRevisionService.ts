import type { Goal } from '../types/goal';
import type { GoalHistoryEntry } from '../types/goalHistory';
import type { GoalRevision, ProposedGoalChanges } from '../types/goalRevision';
import type { RevisionReasonKey } from '../utils/revisionReasonConstants';
import { REVISION_REASON_LABELS } from '../utils/revisionReasonConstants';
import { getDirectReports, getMockUserById } from '../utils/resolveMockUserId';
import goalsService, { type ApprovedRevisionChanges } from './goalsService';
import { resolveMock } from './mock/mockClient';
import { mockGoalHistory } from './mock/mockData/goalHistory';
import { mockGoalRevisions } from './mock/mockData/goalRevisions';

export interface SubmitRevisionRequestPayload {
  goalId: string;
  employeeId: string;
  requestedBy: string;
  reason: RevisionReasonKey;
  otherReason?: string;
  proposedChanges: ProposedGoalChanges;
}

export interface ReviewRevisionPayload {
  reviewerId: string;
  reviewComment: string;
}

let revisions: GoalRevision[] = structuredClone(mockGoalRevisions);
let history: Record<string, GoalHistoryEntry[]> = structuredClone(mockGoalHistory);
let nextRevisionCounter = revisions.length + 1;
let nextHistoryCounter = 1;

/** Maps a ProposedGoalChanges key to the Goal field it patches on approval. */
const PROPOSED_TO_GOAL_FIELD: Array<[keyof ProposedGoalChanges, keyof Goal]> = [
  ['title', 'title'],
  ['description', 'description'],
  ['measurementCriteria', 'successCriteria'],
  ['dueDate', 'targetDate'],
  ['weightage', 'weight'],
  ['category', 'category'],
  ['targetValue', 'targetValue'],
];

function findRevision(id: string): GoalRevision {
  const revision = revisions.find((r) => r.id === id);
  if (!revision) {
    throw new Error('Revision request not found');
  }
  return revision;
}

function replaceRevision(updated: GoalRevision): GoalRevision {
  revisions = revisions.map((r) => (r.id === updated.id ? updated : r));
  return updated;
}

/** Attaches display names/title at read time rather than duplicating them in the mock seed. */
async function enrich(revision: GoalRevision): Promise<GoalRevision> {
  const employee = getMockUserById(revision.employeeId);
  const requester = getMockUserById(revision.requestedBy);
  const reviewer = revision.reviewedBy ? getMockUserById(revision.reviewedBy) : null;
  const goal = await goalsService.getGoalById(revision.goalId).catch(() => null);
  return {
    ...revision,
    goalTitle: goal?.title ?? revision.goalTitle,
    employeeName: employee?.name ?? revision.employeeName,
    requestedByName: requester?.name ?? revision.requestedByName,
    reviewedByName: reviewer?.name ?? revision.reviewedByName,
  };
}

function appendHistory(goalId: string, entry: Omit<GoalHistoryEntry, 'id' | 'goalId'>): void {
  const goalEntries = history[goalId] ? [...history[goalId]] : [];
  if (!goalEntries.some((e) => e.action === 'Goal Created')) {
    goalEntries.unshift({
      id: `hist-${goalId}-${nextHistoryCounter++}`,
      goalId,
      date: new Date().toISOString(),
      action: 'Goal Created',
    });
  }
  goalEntries.push({ id: `hist-${goalId}-${nextHistoryCounter++}`, goalId, ...entry });
  history = { ...history, [goalId]: goalEntries };
}

const goalRevisionService = {
  submitRevisionRequest: async (payload: SubmitRevisionRequestPayload): Promise<GoalRevision> => {
    const directReports = getDirectReports(payload.requestedBy);
    if (!directReports.some((report) => report.id === payload.employeeId)) {
      throw new Error('You are not authorized to request a revision for this employee.');
    }

    const revision: GoalRevision = {
      id: `rev-new-${nextRevisionCounter++}`,
      goalId: payload.goalId,
      employeeId: payload.employeeId,
      employeeName: '',
      requestedBy: payload.requestedBy,
      requestedByName: '',
      requestedAt: new Date().toISOString(),
      reason: payload.reason,
      otherReason: payload.otherReason,
      proposedChanges: payload.proposedChanges,
      status: 'PENDING',
    };

    revisions = [...revisions, revision];

    const requester = getMockUserById(payload.requestedBy);
    appendHistory(payload.goalId, {
      date: revision.requestedAt,
      action: 'Revision Requested',
      reason: REVISION_REASON_LABELS[payload.reason],
      requestedBy: payload.requestedBy,
      requestedByName: requester?.name,
      revisionRequestId: revision.id,
    });

    const enriched = await enrich(revision);
    return resolveMock(enriched);
  },

  /**
   * Returns every revision request regardless of status — the Admin/HR queue filters
   * by status/tab client-side (matches how goalsSlice filters team goals client-side).
   */
  fetchPendingRevisions: async (): Promise<GoalRevision[]> => {
    const enriched = await Promise.all(revisions.map(enrich));
    return resolveMock(enriched);
  },

  fetchManagerRevisionRequests: async (managerId: string): Promise<GoalRevision[]> => {
    const enriched = await Promise.all(
      revisions.filter((r) => r.requestedBy === managerId).map(enrich),
    );
    return resolveMock(enriched);
  },

  approveRevision: async (
    id: string,
    { reviewerId, reviewComment }: ReviewRevisionPayload,
  ): Promise<GoalRevision> => {
    const current = findRevision(id);
    if (current.status !== 'PENDING') {
      throw new Error('This revision request has already been reviewed.');
    }
    if (reviewerId === current.requestedBy) {
      throw new Error('You cannot approve a revision request you submitted yourself.');
    }

    const goal = await goalsService.getGoalById(current.goalId);
    const changes: ApprovedRevisionChanges = {};
    const fieldChanges: Array<{ field: string; oldValue: string; newValue: string }> = [];

    PROPOSED_TO_GOAL_FIELD.forEach(([proposedKey, goalKey]) => {
      const newValue = current.proposedChanges[proposedKey];
      if (newValue === undefined) return;
      const oldValue = goal[goalKey];
      (changes as Record<string, unknown>)[goalKey] = newValue;
      fieldChanges.push({
        field: goalKey,
        oldValue: oldValue === undefined || oldValue === null ? '' : String(oldValue),
        newValue: String(newValue),
      });
    });

    await goalsService.applyRevision(current.goalId, changes);

    const reviewer = getMockUserById(reviewerId);
    const reviewedAt = new Date().toISOString();
    const updated = replaceRevision({
      ...current,
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewedByName: reviewer?.name ?? '',
      reviewedAt,
      reviewComment,
    });

    appendHistory(current.goalId, {
      date: reviewedAt,
      action: 'Revision Approved',
      approvedBy: reviewerId,
      approvedByName: reviewer?.name,
      comment: reviewComment,
      revisionRequestId: current.id,
    });

    fieldChanges.forEach((fieldChange) => {
      appendHistory(current.goalId, {
        date: reviewedAt,
        action: 'Goal Updated',
        field: fieldChange.field,
        oldValue: fieldChange.oldValue,
        newValue: fieldChange.newValue,
        revisionRequestId: current.id,
      });
    });

    const enrichedApproved = await enrich(updated);
    return resolveMock(enrichedApproved);
  },

  rejectRevision: async (
    id: string,
    { reviewerId, reviewComment }: ReviewRevisionPayload,
  ): Promise<GoalRevision> => {
    const current = findRevision(id);
    if (current.status !== 'PENDING') {
      throw new Error('This revision request has already been reviewed.');
    }
    if (reviewerId === current.requestedBy) {
      throw new Error('You cannot reject a revision request you submitted yourself.');
    }
    if (!reviewComment || !reviewComment.trim()) {
      throw new Error('A rejection comment is required.');
    }

    const reviewer = getMockUserById(reviewerId);
    const reviewedAt = new Date().toISOString();
    const updated = replaceRevision({
      ...current,
      status: 'REJECTED',
      reviewedBy: reviewerId,
      reviewedByName: reviewer?.name ?? '',
      reviewedAt,
      reviewComment,
    });

    appendHistory(current.goalId, {
      date: reviewedAt,
      action: 'Revision Rejected',
      approvedBy: reviewerId,
      approvedByName: reviewer?.name,
      comment: reviewComment,
      revisionRequestId: current.id,
    });

    const enrichedRejected = await enrich(updated);
    return resolveMock(enrichedRejected);
  },

  fetchGoalHistory: (goalId: string): Promise<GoalHistoryEntry[]> =>
    resolveMock([...(history[goalId] ?? [])]),
};

export default goalRevisionService;
