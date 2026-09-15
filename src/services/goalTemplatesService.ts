import type { GoalTemplate } from '../types/goalTemplate';
import { resolveMock } from './mock/mockClient';
import { mockGoalTemplates } from './mock/mockData/goalTemplates';

export interface CreateGoalTemplatePayload {
  category: GoalTemplate['category'];
  title: string;
  description: string;
  successCriteria: string;
  weight: number;
}

export type UpdateGoalTemplatePatch = Partial<CreateGoalTemplatePayload>;

let templates: GoalTemplate[] = structuredClone(mockGoalTemplates);
let nextTemplateCounter = templates.length + 1;

function findTemplate(id: string): GoalTemplate {
  const template = templates.find((t) => t.id === id);
  if (!template) {
    throw new Error('Goal template not found');
  }
  return template;
}

function replaceTemplate(updated: GoalTemplate): GoalTemplate {
  templates = templates.map((t) => (t.id === updated.id ? updated : t));
  return updated;
}

const goalTemplatesService = {
  getGoalTemplates: (): Promise<GoalTemplate[]> => resolveMock(templates.map((t) => ({ ...t }))),

  getGoalTemplateById: (id: string): Promise<GoalTemplate> => resolveMock({ ...findTemplate(id) }),

  createGoalTemplate: (payload: CreateGoalTemplatePayload): Promise<GoalTemplate> => {
    const now = new Date().toISOString();
    const template: GoalTemplate = {
      id: `tpl-new-${nextTemplateCounter++}`,
      category: payload.category,
      title: payload.title.trim(),
      description: payload.description.trim(),
      successCriteria: payload.successCriteria.trim(),
      weight: payload.weight,
      createdAt: now,
      updatedAt: now,
    };

    templates = [...templates, template];
    return resolveMock({ ...template });
  },

  updateGoalTemplate: (id: string, patch: UpdateGoalTemplatePatch): Promise<GoalTemplate> => {
    const current = findTemplate(id);
    const updated: GoalTemplate = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return resolveMock(replaceTemplate(updated));
  },

  deleteGoalTemplate: (id: string): Promise<void> => {
    findTemplate(id);
    templates = templates.filter((t) => t.id !== id);
    return resolveMock(undefined);
  },
};

export default goalTemplatesService;
