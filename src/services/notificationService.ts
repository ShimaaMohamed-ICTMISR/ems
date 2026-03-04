import axios from 'axios';
import { store } from '../store/store';
import {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  fetchUnreadCountStart,
  fetchUnreadCountSuccess,
  fetchUnreadCountFailure,
  markAsReadStart,
  markAsReadSuccess,
  markAsReadFailure,
  markAsUnreadStart,
  markAsUnreadSuccess,
  markAsUnreadFailure,
  markAllAsReadStart,
  markAllAsReadSuccess,
  markAllAsReadFailure,
  addNotification,
  setStreamConnected,
  clearError,
} from '../store/notificationSlice';
import type { Notification } from '../store/notificationSlice';
import toast from 'react-hot-toast';

const NOTIFICATION_API_BASE = 'https://ems-notification-service.onrender.com/api/notifications/v1';
const SERVICE_TICKET = 'auH2RtYi9df5vO79WXl5XyaUck6GNwClJ54ayehPU9A=';

// Create axios instance for notification API
const notificationClient = axios.create({
  baseURL: NOTIFICATION_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Ticket': SERVICE_TICKET,
  },
});

export const notificationService = {
  /**
   * Get all notifications or a specific notification by ID
   * @param notificationId - Optional notification ID to get a single notification
   * @param limit - Number of notifications to fetch
   * @param skip - Number of notifications to skip (for pagination)
   */
  getNotifications: async (notificationId?: string, limit: number = 50, skip: number = 0) => {
    try {
      store.dispatch(fetchNotificationsStart());

      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (skip) params.append('skip', skip.toString());

      const endpoint = notificationId ? `/notifications/${notificationId}` : '/notifications';
      const url = notificationId ? endpoint : `${endpoint}?${params.toString()}`;

      const response = await notificationClient.get(url);

      let notifications: Notification[] = [];

      // Handle both single notification and array of notifications
      if (Array.isArray(response.data)) {
        notifications = response.data;
      } else if (response.data?.data) {
        notifications = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (response.data?.notifications) {
        notifications = response.data.notifications;
      } else {
        notifications = [response.data];
      }

      store.dispatch(fetchNotificationsSuccess(notifications));
      return notifications;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      store.dispatch(fetchNotificationsFailure(errorMessage));
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Get unread notification count for a user
   * @param userId - User ID
   */
  getUnreadCount: async (userId: string) => {
    try {
      store.dispatch(fetchUnreadCountStart());

      const response = await notificationClient.get(`/notifications/users/${userId}/unread-count`);

      let unreadCount = 0;

      // Handle different response formats
      if (typeof response.data === 'number') {
        unreadCount = response.data;
      } else if (response.data?.count !== undefined) {
        unreadCount = response.data.count;
      } else if (response.data?.unreadCount !== undefined) {
        unreadCount = response.data.unreadCount;
      } else if (response.data?.data?.count !== undefined) {
        unreadCount = response.data.data.count;
      }

      store.dispatch(fetchUnreadCountSuccess(unreadCount));
      return unreadCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unread count';
      store.dispatch(fetchUnreadCountFailure(errorMessage));
      // Don't show error toast for unread count as it's fetched frequently
      throw error;
    }
  },

  /**
   * Mark a notification as read
   * @param notificationId - Notification ID
   */
  markAsRead: async (notificationId: string) => {
    try {
      store.dispatch(markAsReadStart());

      const response = await notificationClient.post(`/notifications/${notificationId}/read`);

      store.dispatch(markAsReadSuccess(notificationId));
      toast.success('Notification marked as read');
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as read';
      store.dispatch(markAsReadFailure(errorMessage));
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Mark a notification as unread
   * @param notificationId - Notification ID
   */
  markAsUnread: async (notificationId: string) => {
    try {
      store.dispatch(markAsUnreadStart());

      const response = await notificationClient.post(`/notifications/${notificationId}/unread`);

      store.dispatch(markAsUnreadSuccess(notificationId));
      toast.success('Notification marked as unread');
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as unread';
      store.dispatch(markAsUnreadFailure(errorMessage));
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user
   * @param userId - User ID
   */
  markAllAsRead: async (userId: string) => {
    try {
      store.dispatch(markAllAsReadStart());

      const response = await notificationClient.post(`/notifications/users/${userId}/read-all`);

      store.dispatch(markAllAsReadSuccess());
      toast.success('All notifications marked as read');
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all as read';
      store.dispatch(markAllAsReadFailure(errorMessage));
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Subscribe to real-time notifications via Server-Sent Events
   * @param userId - User ID
   * @param onMessage - Callback function when new notification arrives
   * @param onError - Callback function on error
   * @param onOpen - Callback function when connection opens
   * @param onClose - Callback function when connection closes
   */
  streamNotifications: (
    userId: string,
    onMessage?: (notification: Notification) => void,
    onError?: (error: Error) => void,
    onOpen?: () => void,
    onClose?: () => void
  ): (() => void) => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      try {
        const url = new URL(`${NOTIFICATION_API_BASE}/notifications/stream`);
        url.searchParams.append('userId', userId);
        url.searchParams.append('ticket', SERVICE_TICKET);

        eventSource = new EventSource(url.toString());

        eventSource.addEventListener('open', () => {
          store.dispatch(setStreamConnected(true));
          onOpen?.();
        });

        eventSource.addEventListener('notification', (event) => {
          try {
            const notification = JSON.parse(event.data) as Notification;
            store.dispatch(addNotification(notification));
            onMessage?.(notification);
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        });

        eventSource.addEventListener('error', (event) => {
          console.error('SSE Error:', event);
          store.dispatch(setStreamConnected(false));

          if (eventSource?.readyState === EventSource.CLOSED) {
            onClose?.();
            // Try to reconnect after 5 seconds, “If the stream connection closes, wait 5 seconds, then try to reconnect.”
            setTimeout(() => {
              console.log('Attempting to reconnect to notification stream...');
              connect();
            }, 5000);
          } else {
            const error = new Error('Stream connection error');
            onError?.(error);
          }
        });

        eventSource.onerror = () => {
          store.dispatch(setStreamConnected(false));
          if (eventSource?.readyState === EventSource.CLOSED) {
            onClose?.();
            // Try to reconnect after 5 seconds
            setTimeout(() => {
              console.log('Attempting to reconnect to notification stream...');
              connect();
            }, 5000);
          }
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to connect to stream');
        store.dispatch(setStreamConnected(false));
        onError?.(err);
      }
    };

    connect();

    // Return cleanup function
    return () => {
      if (eventSource) {
        eventSource.close();
        store.dispatch(setStreamConnected(false));
        onClose?.();
      }
    };
  },

  /**
   * Delete a notification
   * @param notificationId - Notification ID
   */
  deleteNotification: async (notificationId: string) => {
    try {
      const response = await notificationClient.delete(`/notifications/${notificationId}`);
      toast.success('Notification deleted');
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update a notification
   * @param notificationId - Notification ID
   * @param data - Update data
   */
  updateNotification: async (notificationId: string, data: Partial<Notification>) => {
    try {
      const response = await notificationClient.patch(`/notifications/${notificationId}`, data);
      toast.success('Notification updated');
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Clear any error messages
   */
  clearError: () => {
    store.dispatch(clearError());
  },
};

export default notificationService;
