import type { Goal, GoalCategory, GoalStatus } from '../../../types/goal';
import { GOAL_CATEGORY, GOAL_STATUS } from '../../../utils/goalConstants';
import { ACTIVE_CYCLE_ID } from './performanceCycles';
import { mockUsers } from './users';

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

const GOAL_TEMPLATES: Record<
  GoalCategory,
  Array<{ title: string; description: string; successCriteria: string; weight: number }>
> = {
  ORGANIZATIONAL: [
    {
      title: 'Improve customer satisfaction score',
      description: 'Drive CSAT improvements through faster resolution and proactive communication.',
      successCriteria: 'Achieve CSAT ≥ 4.5/5 for Q3–Q4 measured via quarterly survey.',
      weight: 25,
    },
    {
      title: 'Reduce operational cost by 8%',
      description: 'Identify efficiency gains across team workflows and vendor spend.',
      successCriteria: 'Document ≥ 3 cost-saving initiatives with measurable annual impact.',
      weight: 20,
    },
    {
      title: 'Strengthen compliance with internal audit standards',
      description: 'Ensure all processes meet updated governance requirements.',
      successCriteria: 'Zero critical audit findings in the annual review cycle.',
      weight: 15,
    },
  ],
  ROLE: [
    {
      title: 'Deliver key project milestones on schedule',
      description: 'Own delivery of assigned project phases with cross-functional coordination.',
      successCriteria: 'Complete 100% of committed milestones by target dates.',
      weight: 30,
    },
    {
      title: 'Improve team throughput and quality',
      description: 'Increase delivery velocity while maintaining quality gates.',
      successCriteria: 'Reduce rework rate by 15% compared to H1 baseline.',
      weight: 25,
    },
    {
      title: 'Mentor junior team members',
      description: 'Provide structured coaching and code/design review support.',
      successCriteria: 'Conduct bi-weekly 1:1s and document mentee growth plans.',
      weight: 15,
    },
  ],
  DEVELOPMENT: [
    {
      title: 'Complete advanced certification',
      description: 'Upskill in a domain-relevant certification program.',
      successCriteria: 'Obtain certification by March 2027.',
      weight: 10,
    },
    {
      title: 'Build leadership and communication skills',
      description: 'Participate in leadership workshops and present at team forums.',
      successCriteria: 'Deliver 2 internal presentations and complete leadership module.',
      weight: 10,
    },
    {
      title: 'Learn new technology stack component',
      description: 'Gain hands-on proficiency in assigned emerging technology.',
      successCriteria: 'Ship one production feature using the new stack.',
      weight: 10,
    },
  ],
};

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
