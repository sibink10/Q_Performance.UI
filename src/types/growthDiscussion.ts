export type GrowthDiscussionStatus = 'NOT_STARTED' | 'SCHEDULED' | 'COMPLETED';

export interface GrowthDiscussionAction {
  id: string;
  description: string;
  ownerId: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface GrowthDiscussion {
  id: string;
  cycleId: string;
  employeeId: string;
  managerId: string;
  status: GrowthDiscussionStatus;
  scheduledDate: string | null;
  discussionNotes: string;
  growthAreas: string;
  careerAspirations: string;
  agreedActions: GrowthDiscussionAction[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
