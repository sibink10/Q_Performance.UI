// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((res) => !cancelled && setNotifications(res))
      .catch(() => !cancelled && setNotifications([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    markNotificationRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markAllNotificationsRead().catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, loading, unreadCount, markRead, markAllRead };
};
