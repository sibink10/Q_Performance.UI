import type { GoalComment } from '../../../types/goalComment';

export const mockGoalComments: GoalComment[] = [
  {
    id: 'goal-comment-1',
    goalId: 'goal-006-1',
    authorId: 'usr-006',
    authorName: 'Arjun Nair',
    authorRole: 'EMPLOYEE',
    text: 'Completed the first milestone ahead of schedule. Sharing the summary doc in our next 1:1.',
    createdAt: '2026-06-12T09:15:00.000Z',
  },
  {
    id: 'goal-comment-2',
    goalId: 'goal-006-1',
    authorId: 'usr-003',
    authorName: 'Anita Desai',
    authorRole: 'MANAGER',
    text: "Great pace, Arjun. Let's make sure the rollout plan covers the EU region too.",
    createdAt: '2026-06-13T14:40:00.000Z',
  },
  {
    id: 'goal-comment-3',
    goalId: 'goal-006-1',
    authorId: 'usr-001',
    authorName: 'Priya Sharma',
    authorRole: 'ADMIN',
    text: 'Flagging this goal for the mid-cycle calibration review.',
    createdAt: '2026-06-20T11:05:00.000Z',
  },
  {
    id: 'goal-comment-4',
    goalId: 'goal-010-1',
    authorId: 'usr-004',
    authorName: 'Vikram Singh',
    authorRole: 'MANAGER',
    text: 'Please add the customer feedback link once the beta closes.',
    createdAt: '2026-07-02T08:30:00.000Z',
  },
];
