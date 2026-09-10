export type NotificationType =
  | 'GOAL_REVISION'
  | 'GROWTH_CONNECT'
  | 'SELF_APPRAISAL'
  | 'MANAGER_ASSESSMENT'
  | 'CALIBRATION'
  | 'FINAL_OUTCOME'
  | 'GENERAL';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  entityType: string | null;
  entityId: string | null;
  link: string | null;
  createdAt: string;
}
