// Dummy notification data for the UI. Replace the bodies with real API calls later (same signatures).
import type { AppNotification } from '../types/notification';

let store: AppNotification[] = [
  { id: 'n1', title: 'Self evaluation is open', message: 'Your self evaluation window is now open.', createdAt: '2026-09-21T08:30:00', isRead: false, path: '/performance' },
  { id: 'n2', title: 'Goal approved', message: 'Your manager approved one of your goals.', createdAt: '2026-09-19T11:45:00', isRead: false, path: '/performance/goals' },
  { id: 'n3', title: 'Revision request update', message: 'A goal revision request is awaiting approval.', createdAt: '2026-09-18T15:20:00', isRead: false },
  { id: 'n4', title: 'Review form assigned', message: 'A new review form has been assigned to you.', createdAt: '2026-09-16T09:00:00', isRead: true, path: '/performance' },
  { id: 'n5', title: 'Results published', message: 'Your results are now available.', createdAt: '2026-09-11T12:00:00', isRead: true, path: '/performance/results' },
];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getNotifications(): Promise<AppNotification[]> {
  await delay();
  return store.map((n) => ({ ...n }));
}

export async function markNotificationRead(id: string): Promise<void> {
  store = store.map((n) => (n.id === id ? { ...n, isRead: true } : n));
}

export async function markAllNotificationsRead(): Promise<void> {
  store = store.map((n) => ({ ...n, isRead: true }));
}
