import type { Goal, GoalCategory, GoalStatus } from '../../../types/goal';
import { GOAL_CATEGORY, GOAL_STATUS } from '../../../utils/goalConstants';
import { ACTIVE_CYCLE_ID } from './performanceCycles';
import { mockUsers } from './users';
import { groupTemplatesByCategory } from './goalTemplates';

const STATUSES: GoalStatus[] = [
  GOAL_STATUS.ON_TRACK,
  GOAL_STATUS.NEEDS_ATTENTION,
  GOAL_STATUS.OFF_TRACK,
  GOAL_STATUS.COMPLETED,
];

const CATEGORIES: GoalCategory[] = [
  GOAL_CATEGORY.ORGANIZATIONAL,
  GOAL_CATEGORY.ROLE,
  GOAL_CATEGORY.DEVELOPMENT,
];

function progressForStatus(status: GoalStatus, seed: number): number {
  switch (status) {
    case GOAL_STATUS.COMPLETED:
      return 100;
    case GOAL_STATUS.ON_TRACK:
      return 65 + (seed % 26);
    case GOAL_STATUS.NEEDS_ATTENTION:
      return 40 + (seed % 21);
    case GOAL_STATUS.OFF_TRACK:
      return 5 + (seed % 31);
    default:
      return 0;
  }
}

const GOAL_TEMPLATES = groupTemplatesByCategory();

function buildGoalsForEmployee(employeeId: string, employeeIndex: number): Goal[] {
  const goalCount = 5 + (employeeIndex % 4);
  const goals: Goal[] = [];
  let templateIndex = 0;

  for (let i = 0; i < goalCount; i += 1) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const templates = GOAL_TEMPLATES[category];
    const template = templates[templateIndex % templates.length];
    templateIndex += 1;

    const status = STATUSES[(employeeIndex + i) % STATUSES.length];
    const progress = progressForStatus(status, employeeIndex + i);
    const goalNum = i + 1;
    const id = `goal-${employeeId.replace('usr-', '')}-${goalNum}`;

    goals.push({
      id,
      cycleId: ACTIVE_CYCLE_ID,
      employeeId,
      category,
      title: template.title,
      description: template.description,
      weight: template.weight,
      status,
      progress,
      startDate: '2026-04-01',
      targetDate: '2027-03-15',
      successCriteria: template.successCriteria,
      isFinalized: true,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
  }

  return goals;
}

export const mockGoals: Goal[] = mockUsers
  .filter((user) => user.role === 'EMPLOYEE')
  .flatMap((user, index) => buildGoalsForEmployee(user.id, index));
