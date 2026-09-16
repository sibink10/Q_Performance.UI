import api from './api';
import type { GoalComment } from '../types/goalComment';
import type { UserRole } from '../types/user';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mapComment(raw: Record<string, unknown>): GoalComment {
  return {
    id: String(raw.id ?? ''),
    goalId: String(raw.goalId ?? ''),
    authorId: String(raw.authorId ?? ''),
    authorName: String(raw.authorName ?? ''),
    authorRole: (String(raw.authorRole ?? '') || 'EMPLOYEE') as UserRole,
    text: String(raw.text ?? ''),
    createdAt: String(raw.createdAt ?? ''),
  };
}

export interface AddGoalCommentPayload {
  text: string;
}

/** GET /performance/goals/{goalId}/comments */
export async function getCommentsByGoal(goalId: string): Promise<GoalComment[]> {
  const payload = await api.get(`/performance/goals/${goalId}/comments`);
  const root = asRecord(payload) ?? {};
  const rows = Array.isArray(root.data) ? root.data : [];
  return rows.map((row) => mapComment(asRecord(row) ?? {}));
}

/**
 * No backend batch endpoint exists — counts are computed client-side by fetching each
 * goal's comments and counting results.
 */
export async function getCommentCounts(goalIds: string[]): Promise<Record<string, number>> {
  const uniqueIds = Array.from(new Set(goalIds));
  const lists = await Promise.all(uniqueIds.map((id) => getCommentsByGoal(id)));
  const counts: Record<string, number> = {};
  uniqueIds.forEach((id, index) => {
    counts[id] = lists[index]?.length ?? 0;
  });
  return counts;
}

/** POST /performance/goals/{goalId}/comments — backend derives authorId/authorRole from the JWT. */
export async function addComment(goalId: string, payload: AddGoalCommentPayload): Promise<GoalComment> {
  const response = await api.post(`/performance/goals/${goalId}/comments`, { text: payload.text });
  const root = asRecord(response) ?? {};
  return mapComment(asRecord(root.data) ?? {});
}

/** DELETE /performance/goal-comments/{id} */
export async function deleteComment(id: string): Promise<void> {
  await api.delete(`/performance/goal-comments/${id}`);
}

const goalCommentsService = {
  getCommentsByGoal,
  getCommentCounts,
  addComment,
  deleteComment,
};

export default goalCommentsService;
