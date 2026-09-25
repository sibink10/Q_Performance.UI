// Notification data backed by the real API (GET/POST /notifications). Same exported
// signatures as before, so callers (useNotifications, etc.) needed no changes.
import api from './api';
import type { AppNotification } from '../types/notification';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mapNotification(raw: Record<string, unknown>): AppNotification {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    isRead: Boolean(raw.isRead),
    path: raw.path != null ? String(raw.path) : undefined,
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  const payload = await api.get('/notifications');
  const list = asRecord(payload)?.data;
  return Array.isArray(list) ? list.map((row) => mapNotification(asRecord(row) ?? {})) : [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}
