import type { GoalComment } from '../types/goalComment';
import type { UserRole } from '../types/user';
import { resolveMock } from './mock/mockClient';
import { mockGoalComments } from './mock/mockData/goalComments';

export interface AddGoalCommentPayload {
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
}

let goalComments: GoalComment[] = structuredClone(mockGoalComments);
let nextCommentCounter = goalComments.length + 1;

const goalCommentsService = {
  getCommentsByGoal: (goalId: string): Promise<GoalComment[]> =>
    resolveMock(
      goalComments
        .filter((c) => c.goalId === goalId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((c) => ({ ...c })),
    ),

  getCommentCounts: (goalIds: string[]): Promise<Record<string, number>> => {
    const idSet = new Set(goalIds);
    const counts: Record<string, number> = {};
    goalComments.forEach((c) => {
      if (idSet.has(c.goalId)) {
        counts[c.goalId] = (counts[c.goalId] ?? 0) + 1;
      }
    });
    return resolveMock(counts);
  },

  addComment: (goalId: string, payload: AddGoalCommentPayload): Promise<GoalComment> => {
    const comment: GoalComment = {
      id: `goal-comment-new-${nextCommentCounter++}`,
      goalId,
      authorId: payload.authorId,
      authorName: payload.authorName,
      authorRole: payload.authorRole,
      text: payload.text.trim(),
      createdAt: new Date().toISOString(),
    };

    goalComments = [...goalComments, comment];
    return resolveMock({ ...comment });
  },

  deleteComment: (id: string): Promise<void> => {
    goalComments = goalComments.filter((c) => c.id !== id);
    return resolveMock(undefined);
  },
};

export default goalCommentsService;
