import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  _id?: string;
  id?: string;
  subject?: string;
  message?: string;
  body?: string;
  title?: string;
  content?: string;
  type?: string;
  category?: string;
  channel?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: string[];
  isRead?: boolean;
  hasRead?: boolean;
  read?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
  bodyText?: string;
  status?: string;
  readAt?: string | null;
  metadata?: Record<string, any>;
  sender?: {
    id?: string;
    name?: string;
    email?: string;
  };
  actionUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface StreamNotification {
  id: string
  notification: Notification
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  currentNotification: Notification | null;
  lastFetch: number | null;
  isStreamConnected: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  currentNotification: null,
  lastFetch: null,
  isStreamConnected: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Fetch notifications
    fetchNotificationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchNotificationsSuccess: (state, action: PayloadAction<Notification[]>) => {
      state.loading = false;
      state.notifications = action.payload;
      state.lastFetch = Date.now();
      state.error = null;
    },
    fetchNotificationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get unread count
    fetchUnreadCountStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUnreadCountSuccess: (state, action: PayloadAction<number>) => {
      state.loading = false;
      state.unreadCount = action.payload;
      state.error = null;
    },
    fetchUnreadCountFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Mark as read
    markAsReadStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    markAsReadSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      const notification = state.notifications.find((n) => n._id === action.payload || n.id === action.payload);
      if (notification) {
        console.log("🚀 ~ notification:", notification)
        notification.isRead = true;
        notification.read = true;
        
      }
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
      state.error = null;
    },
    markAsReadFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Mark as unread
    markAsUnreadStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    markAsUnreadSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      const notification = state.notifications.find((n) => n._id === action.payload || n.id === action.payload);
      if (notification) {
        notification.isRead = false;
        notification.read = false;
      }
      state.unreadCount += 1;
      state.error = null;
    },
    markAsUnreadFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Mark all as read
    markAllAsReadStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    markAllAsReadSuccess: (state) => {
      state.loading = false;
      state.notifications.forEach((n) => {
        n.isRead = true;
        n.read = true;
      });
      state.unreadCount = 0;
      state.error = null;
    },
    markAllAsReadFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Add new notification (from stream)
    addNotification: (state, action: PayloadAction<StreamNotification>) => {
      const { notification } = action.payload;

      const idToCheck = notification.id
      if (!idToCheck) return;

      const exists = state.notifications.find(
        (n) => (n.id === idToCheck || n._id === idToCheck)
      );
      if (!exists) {
        state.notifications.unshift(notification);
        // Ensure unread count only increments for actual unread items
        const isRead = notification.isRead === true || notification.read === true || notification.readAt;
        if (!isRead) {
          state.unreadCount += 1;
        }
      }
    },

    // Set current notification
    setCurrentNotification: (state, action: PayloadAction<Notification | null>) => {
      state.currentNotification = action.payload;
    },

    // Stream connection status
    setStreamConnected: (state, action: PayloadAction<boolean>) => {
      state.isStreamConnected = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset state
    resetNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.loading = false;
      state.error = null;
      state.currentNotification = null;
      state.lastFetch = null;
      state.isStreamConnected = false;
    },
  },
});

export const {
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
  setCurrentNotification,
  setStreamConnected,
  clearError,
  resetNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
