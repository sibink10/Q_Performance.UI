export type DevelopmentPlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';

export interface DevelopmentAction {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface DevelopmentPlan {
  id: string;
  cycleId: string;
  employeeId: string;
  goals: string[];
  actions: DevelopmentAction[];
  timeline: string;
  status: DevelopmentPlanStatus;
  createdAt: string;
  updatedAt: string;
}
