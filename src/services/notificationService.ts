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

const NOTIFICATION_API_BASE =
  import.meta.env.VITE_NOTIFICATION_API_BASE_URL ??
  'https://ems-notification-service.onrender.com/api/notifications/v1';

const SERVICE_TICKET =
  import.meta.env.VITE_NOTIFICATION_SERVICE_TICKET ?? 'TEST-SECRET-TICKET-2026';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return navigator.onLine
        ? 'Notification service is currently unreachable. Please try again in a moment.'
        : 'No internet connection. Please reconnect and try again.';
    }

    return error.response?.data?.message || error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

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
   * @param page - Page number (1-indexed)
   * @param filters - Optional filters (userId, priority, category, etc.)
   */
  getNotifications: async (
    notificationId?: string, 
    limit: number = 5, 
    page: number = 1,
    filters?: {
      /** Optional — narrow list to one user (notification API query param when supported). */
      userId?: string;
      /** Optional — narrow list to a department when the API supports it. */
      departmentId?: string;
      priority?: string;
      category?: string;
      channel?: string;
      status?: string;
      isRead?: boolean;
    }
  ) => {
    try {
      store.dispatch(fetchNotificationsStart());

      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('page', page.toString());
      
      // Add filters if provided (all optional — omit query keys when undefined)
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.departmentId) params.append('departmentId', filters.departmentId);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.channel) params.append('channel', filters.channel);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());

      const endpoint = notificationId ? `/notifications/${notificationId}` : '/notifications';
      const url = notificationId ? endpoint : `${endpoint}?${params.toString()}`;

      const response = await notificationClient.get(url);

      let notifications: Notification[] = [];
      let paginationData: any = {};

      // Handle both single notification and array of notifications
      const responseData = response.data;
      
      // console.log('API Response:', responseData);

      // Extract data - try multiple possible structures
      const rawData = responseData?.data?.data || responseData?.data || responseData;

      if (Array.isArray(rawData)) {
        notifications = rawData;
      } else if (rawData?.notifications) {
        notifications = rawData.notifications;
      } else if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        notifications = [rawData];
      }

      // Extract pagination metadata - try multiple possible structures
      if (responseData?.data?.pagination) {
        paginationData = responseData.data.pagination;
      } else if (responseData?.pagination) {
        paginationData = responseData.pagination;
      } else if (responseData?.data?.total !== undefined) {
        // If pagination is at data level
        paginationData = {
          total: responseData.data.total,
          page: responseData.data.page || page,
          limit: responseData.data.limit || limit,
          totalPages: responseData.data.totalPages || Math.ceil((responseData.data.total || 0) / limit)
        };
      }

      // console.log('Extracted pagination:', paginationData);
      // console.log('Extracted notifications count:', notifications.length);

      store.dispatch(fetchNotificationsSuccess(notifications));
      
      // Return both notifications and pagination data
      return {
        notifications,
        total: paginationData.total || paginationData.totalItems || notifications.length,
        page: paginationData.page || paginationData.currentPage || page,
        limit: paginationData.limit || paginationData.pageSize || limit,
        totalPages: paginationData.totalPages || Math.ceil((paginationData.total || notifications.length) / limit)
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch notifications');
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
      const errorMessage = getErrorMessage(error, 'Failed to fetch unread count');
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
      const errorMessage = getErrorMessage(error, 'Failed to mark as read');
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
      const errorMessage = getErrorMessage(error, 'Failed to mark as unread');
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

      // Immediately update the local state to show all as read
      store.dispatch(markAllAsReadSuccess());

      // Also refresh the unread count
      await notificationService.getUnreadCount(userId);

      toast.success('All notifications marked as read');
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to mark all as read');
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

        eventSource.addEventListener('notification.created', (event) => {
          try {
            const rawData = JSON.parse(event.data);
            // Handle both flat notification and nested data structure
            const notification = rawData?.data || rawData;

            console.log('Processed stream notification:', notification);
            store.dispatch(addNotification(notification));
            onMessage?.(notification);
          } catch (error) {
            console.error('Error parsing notification:', error);
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



  //   /**
  //  * Subscribe to real-time notifications via Server-Sent Events
  //  * @param onMessage - Callback function when new notification arrives
  //  * @param onError - Callback function on error
  //  * @param onOpen - Callback function when connection opens
  //  * @param onClose - Callback function when connection closes
  //  */
  // streamAllNotificationsForAdmin: (
  //   onMessage?: (notification: Notification) => void,
  //   onError?: (error: Error) => void,
  //   onOpen?: () => void,
  //   onClose?: () => void
  // ): (() => void) => {
  //   let eventSource: EventSource | null = null;

  //   const connect = () => {
  //     try {
  //       const url = new URL(`${NOTIFICATION_API_BASE}/notifications/stream/all`);
  //       url.searchParams.append('ticket', SERVICE_TICKET);

  //       eventSource = new EventSource(url.toString());

  //       eventSource.addEventListener('open', () => {
  //         store.dispatch(setStreamConnected(true));
  //         onOpen?.();
  //       });

  //       eventSource.addEventListener('notification.created', (event) => {
  //         try {
  //           const rawData = JSON.parse(event.data);
  //           // Handle both flat notification and nested data structure
  //           const notification = rawData?.data || rawData;

  //           console.log('Processed all stream notification:', notification);
  //           store.dispatch(addNotification(notification));
  //           onMessage?.(notification);
  //         } catch (error) {
  //           console.error('Error parsing notification:', error);
  //         }
  //       });

  //       eventSource.onerror = () => {
  //         store.dispatch(setStreamConnected(false));
  //         if (eventSource?.readyState === EventSource.CLOSED) {
  //           onClose?.();
  //           // Try to reconnect after 5 seconds
  //           setTimeout(() => {
  //             console.log('Attempting to reconnect to notification stream...');
  //             connect();
  //           }, 5000);
  //         }
  //       };
  //     } catch (error) {
  //       const err = error instanceof Error ? error : new Error('Failed to connect to stream');
  //       store.dispatch(setStreamConnected(false));
  //       onError?.(err);
  //     }
  //   };

  //   connect();

  //   // Return cleanup function
  //   return () => {
  //     if (eventSource) {
  //       eventSource.close();
  //       store.dispatch(setStreamConnected(false));
  //       onClose?.();
  //     }
  //   };
  // },

  /**
   * Delete a notification
   * @param notificationId - Notification ID
   */
  deleteNotification: async (notificationId: string) => {
    try {
      const response = await notificationClient.delete(`/notifications/${notificationId}`);

      // Update store after deletion if it was successful
      store.dispatch(fetchNotificationsSuccess(
        store.getState().notification.notifications.filter(n => (n._id || n.id) !== notificationId)
      ));

      toast.success('Notification deleted');
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to delete notification');
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
      const errorMessage = getErrorMessage(error, 'Failed to update notification');
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
