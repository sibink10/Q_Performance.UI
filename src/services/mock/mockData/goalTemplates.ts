import type { GoalCategory } from '../../../types/goal';
import type { GoalTemplate } from '../../../types/goalTemplate';
import { GOAL_CATEGORY } from '../../../utils/goalConstants';

const SEED_AT = '2026-04-01T00:00:00.000Z';

const TEMPLATE_SEED: Record<
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

export const mockGoalTemplates: GoalTemplate[] = (
  Object.entries(TEMPLATE_SEED) as Array<[GoalCategory, (typeof TEMPLATE_SEED)[GoalCategory]]>
).flatMap(([category, templates]) =>
  templates.map((template, index) => ({
    id: `tpl-${category.toLowerCase()}-${index + 1}`,
    category,
    ...template,
    createdAt: SEED_AT,
    updatedAt: SEED_AT,
  })),
);

/** Groups templates by category, preserving the seed order within each group. */
export function groupTemplatesByCategory(
  templates: GoalTemplate[] = mockGoalTemplates,
): Record<GoalCategory, GoalTemplate[]> {
  return {
    [GOAL_CATEGORY.ORGANIZATIONAL]: templates.filter((t) => t.category === GOAL_CATEGORY.ORGANIZATIONAL),
    [GOAL_CATEGORY.ROLE]: templates.filter((t) => t.category === GOAL_CATEGORY.ROLE),
    [GOAL_CATEGORY.DEVELOPMENT]: templates.filter((t) => t.category === GOAL_CATEGORY.DEVELOPMENT),
  };
}
