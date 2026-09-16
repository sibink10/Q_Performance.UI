import type { GoalTemplate } from '../types/goalTemplate';

/** Display order for goal templates: Development, then Organizational, then Role. */
const CATEGORY_SORT_ORDER: Record<string, number> = {
  DEVELOPMENT: 0,
  ORGANIZATIONAL: 1,
  ROLE: 2,
};

function categorySortRank(category: string): number {
  return CATEGORY_SORT_ORDER[category] ?? Object.keys(CATEGORY_SORT_ORDER).length;
}

/** Sorts goal templates by category (Development, Organizational, Role), then title A–Z within each category. */
export function sortGoalTemplatesByCategory(templates: GoalTemplate[]): GoalTemplate[] {
  return [...templates].sort((a, b) => {
    const rankDiff = categorySortRank(a.category) - categorySortRank(b.category);
    return rankDiff !== 0 ? rankDiff : a.title.localeCompare(b.title);
  });
}
