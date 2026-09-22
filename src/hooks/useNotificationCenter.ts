// @ts-nocheck
// Tiny module-level pub/sub so any component (e.g. Home's "View all") can open the
// navbar notification bell's popover without lifting state through Redux.
import { useEffect } from 'react';

const listeners = new Set();

/** Tells any subscribed NotificationBell to open its popover. */
export const openNotifications = () => {
  listeners.forEach((fn) => fn());
};

/** Subscribes `onOpen` to `openNotifications()` calls for the lifetime of the component. */
export const useNotificationOpenSignal = (onOpen) => {
  useEffect(() => {
    listeners.add(onOpen);
    return () => listeners.delete(onOpen);
  }, [onOpen]);
};
