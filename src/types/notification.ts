export interface AppNotification {
  id: string;
  title: string;
  message: string;
  /** ISO date string */
  createdAt: string;
  isRead: boolean;
  /** Optional in-app route to open when the notification is clicked */
  path?: string;
}
