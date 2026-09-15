import type { Goal, GoalStatus } from '../types/goal';
import type { MockUser } from '../types/user';
import { GOAL_STATUS } from '../utils/goalConstants';
import { resolveMock } from './mock/mockClient';
import { mockGoals } from './mock/mockData/goals';
import { mockUsers } from './mock/mockData/users';

export interface CreateGoalPayload {
  cycleId: string;
  employeeId: string;
  category: Goal['category'];
  title: string;
  description: string;
  weight: number;
  startDate: string;
  targetDate: string;
  successCriteria: string;
}

export interface UpdateGoalPatch {
  status?: GoalStatus;
  progress?: number;
  category?: Goal['category'];
  title?: string;
  description?: string;
  successCriteria?: string;
  weight?: number;
  startDate?: string;
  targetDate?: string;
}

export type ApprovedRevisionChanges = Partial<
  Pick<
    Goal,
    'title' | 'description' | 'successCriteria' | 'targetDate' | 'weight' | 'category' | 'targetValue'
  >
>;

let goals: Goal[] = structuredClone(mockGoals);
let nextGoalCounter = goals.length + 1;

function findGoal(id: string): Goal {
  const goal = goals.find((g) => g.id === id);
  if (!goal) {
    throw new Error('Goal not found');
  }
  return goal;
}

function applyPatch(goal: Goal, patch: UpdateGoalPatch): Goal {
  const updated: Goal = {
    ...goal,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  if (patch.status === GOAL_STATUS.COMPLETED) {
    updated.progress = 100;
  } else if (patch.status === GOAL_STATUS.ON_TRACK && updated.progress < 65) {
    updated.progress = 65;
  } else if (patch.status === GOAL_STATUS.NEEDS_ATTENTION && updated.progress > 60) {
    updated.progress = 50;
  } else if (patch.status === GOAL_STATUS.OFF_TRACK && updated.progress > 35) {
    updated.progress = 25;
  }

  return updated;
}

function replaceGoal(updated: Goal): Goal {
  goals = goals.map((g) => (g.id === updated.id ? updated : g));
  return updated;
}

const goalsService = {
  getGoalsByEmployee: (employeeId: string, cycleId: string): Promise<Goal[]> =>
    resolveMock(
      goals.filter((g) => g.employeeId === employeeId && g.cycleId === cycleId).map((g) => ({ ...g })),
    ),

  getGoalsByCycle: (cycleId: string): Promise<Goal[]> =>
    resolveMock(goals.filter((g) => g.cycleId === cycleId).map((g) => ({ ...g }))),

  /** Everyone who can be assigned a goal by an Admin - all mock users except ADMIN. */
  getAssignableEmployees: (): Promise<MockUser[]> =>
    resolveMock(mockUsers.filter((u) => u.role !== 'ADMIN').map((u) => ({ ...u }))),

  getTeamGoals: (managerId: string, cycleId: string): Promise<Goal[]> => {
    const reportIds = mockUsers
      .filter((u) => u.managerId === managerId && u.role === 'EMPLOYEE')
      .map((u) => u.id);

    return resolveMock(
      goals
        .filter((g) => g.cycleId === cycleId && reportIds.includes(g.employeeId))
        .map((g) => ({ ...g })),
    );
  },

  createGoal: (payload: CreateGoalPayload): Promise<Goal> => {
    const goal: Goal = {
      id: `goal-new-${nextGoalCounter++}`,
      cycleId: payload.cycleId,
      employeeId: payload.employeeId,
      category: payload.category,
      title: payload.title.trim(),
      description: payload.description.trim(),
      weight: payload.weight,
      status: GOAL_STATUS.ON_TRACK,
      progress: 0,
      startDate: payload.startDate,
      targetDate: payload.targetDate,
      successCriteria: payload.successCriteria.trim(),
      isFinalized: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    goals = [...goals, goal];
    return resolveMock({ ...goal });
  },

  updateGoal: (id: string, patch: UpdateGoalPatch): Promise<Goal> => {
    const current = findGoal(id);
    const updated = applyPatch({ ...current }, patch);
    return resolveMock(replaceGoal(updated));
  },

  deleteGoal: (id: string): Promise<void> => {
    findGoal(id);
    goals = goals.filter((g) => g.id !== id);
    return resolveMock(undefined);
  },

  /**
   * Applies the field values approved from a GoalRevision. Kept separate from
   * `updateGoal` so the status/progress-only mutation path used by the UI stays untouched —
   * this is only ever called from goalRevisionService.approveRevision.
   */
  applyRevision: (id: string, changes: ApprovedRevisionChanges): Promise<Goal> => {
    const current = findGoal(id);
    const updated: Goal = {
      ...current,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    return resolveMock(replaceGoal(updated));
  },

  getGoalById: (id: string): Promise<Goal> => resolveMock({ ...findGoal(id) }),
};

export default goalsService;
