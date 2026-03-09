import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { notificationService } from '../services/notificationService';
import { setCurrentNotification } from '../store/notificationSlice';
import type { Notification } from '../store/notificationSlice';
import { usePermissions } from '../hooks/usePermissions';

interface NotificationTypeConfig {
  icon: string;
  color: string;
  bgColor: string;
}

const notificationTypeMap: Record<string, NotificationTypeConfig> = {
  project: {
    icon: 'bi-folder-plus',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
  },
  meeting: {
    icon: 'bi-calendar-event',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
  },
  poll: {
    icon: 'bi-bar-chart',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  task: {
    icon: 'bi-check-circle',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  alert: {
    icon: 'bi-exclamation-circle',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  info: {
    icon: 'bi-info-circle',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  default: {
    icon: 'bi-bell',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
  },
};

function getNotificationConfig(type?: string): NotificationTypeConfig {
  const key = type?.toLowerCase() || 'default';
  return notificationTypeMap[key] || notificationTypeMap.default;
}

function formatTimeAgo(date?: string): string {
  if (!date) return 'Just now';

  const timestamp = new Date(date).getTime();
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // Format as date
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Notifications() {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((state: RootState) => state.notification.notifications);
  const unreadCount = useSelector((state: RootState) => state.notification.unreadCount);
  const loading = useSelector((state: RootState) => state.notification.loading);
  const error = useSelector((state: RootState) => state.notification.error);
  const user = useSelector((state: RootState) => state.auth.user);

  const { hasFeaturePermission } = usePermissions();
  const [isMarking, setIsMarking] = useState(false);

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        await notificationService.getNotifications(undefined, 50, 0);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setIsMarking(true);
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      setIsMarking(true);
      await notificationService.markAsUnread(notificationId);
    } catch (error) {
      console.error('Error marking as unread:', error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      setIsMarking(true);
      await notificationService.markAllAsRead(user.id);
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      setIsMarking(true);
      await notificationService.deleteNotification(notificationId);
      // Re-fetch notifications after deletion
      await notificationService.getNotifications(undefined, 50, 0);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    dispatch(setCurrentNotification(notification));

    // Mark as read if unread
    if (!notification.isRead && !notification.read) {
      handleMarkAsRead(notification._id || notification.id || '');
    }
  };

  // Filter out empty notifications (notifications without subject/title or message/body)
  const validNotifications = notifications.filter(
    (n) => (n.subject || n.title) && (n.message || n.body || n.content)
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: '#1e293b' }}>
            Notifications
          </h2>
          <p className="text-muted mb-0">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {hasFeaturePermission('MARK_NOTIFICATION_READ') && (
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarking || unreadCount === 0 || validNotifications.length === 0}
          >
            {isMarking ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Marking...
              </>
            ) : (
              <>
                <i className="bi bi-check-all me-2"></i>
                Mark all as read
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => notificationService.clearError()}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Loading State */}
      {loading && validNotifications.length === 0 && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading notifications...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && validNotifications.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-bell-slash fs-1 text-muted d-block mb-3"></i>
          <h5 className="text-muted">No notifications yet</h5>
          <p className="text-muted small">When you have activities, they'll show up here</p>
        </div>
      )}

      {/* Notifications List */}
      {validNotifications.length > 0 && (
        <div className="list-group shadow-sm">
          {validNotifications.map((notification) => {
            const isUnread = !notification.isRead && !notification.read;
            const config = getNotificationConfig(notification.type);
            const notifId = notification._id || notification.id || '';

            return (
              <div
                key={notifId}
                className={`list-group-item list-group-item-action border-0 border-start border-4 mb-2 transition-all ${isUnread ? '' : 'opacity-75'}`}
                style={{
                  borderColor: config.color,
                  backgroundColor: isUnread ? 'rgba(255, 255, 255, 0.5)' : '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="d-flex w-100 justify-content-between align-items-start gap-3">
                  {/* Icon */}
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      backgroundColor: config.bgColor,
                    }}
                  >
                    <i className={`bi ${config.icon} fs-5`} style={{ color: config.color }}></i>
                  </div>

                  {/* Content */}
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className={`mb-1 ${isUnread ? 'fw-bold' : 'fw-semibold'}`} style={{ color: '#1e293b' }}>
                          {notification.subject || notification.title || 'Notification'}
                        </h6>
                        <p className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                          {notification.message || notification.body || notification.content || 'No description'}
                        </p>
                        <div className="d-flex align-items-center gap-3">
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {formatTimeAgo(notification.createdAt || notification.timestamp)}
                          </small>
                          {notification.priority && (
                            <small
                              className={`badge ${
                                notification.priority === 'urgent' || notification.priority === 'high'
                                  ? 'bg-danger'
                                  : notification.priority === 'medium'
                                    ? 'bg-warning text-dark'
                                    : 'bg-secondary'
                              }`}
                            >
                              {notification.priority}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2 flex-shrink-0">
                    {isUnread && hasFeaturePermission('MARK_NOTIFICATION_READ') && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notifId);
                        }}
                        disabled={isMarking}
                        title="Mark as read"
                      >
                        <i className="bi bi-check"></i>
                      </button>
                    )}
                    {!isUnread && hasFeaturePermission('MARK_NOTIFICATION_READ') && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsUnread(notifId);
                        }}
                        disabled={isMarking}
                        title="Mark as unread"
                      >
                        <i className="bi bi-arrow-counterclockwise"></i>
                      </button>
                    )}
                    {hasFeaturePermission('DELETE_NOTIFICATION') && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notifId);
                        }}
                        disabled={isMarking}
                        title="Delete notification"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>

                  {/* Unread Indicator */}
                  {isUnread && (
                    <div
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: '8px',
                        height: '8px',
                        minWidth: '8px',
                        backgroundColor: config.color,
                      }}
                    ></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {validNotifications.length > 0 && validNotifications.length % 50 === 0 && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary"
            onClick={async () => {
              try {
                await notificationService.getNotifications(undefined, 50, validNotifications.length);
              } catch (error) {
                console.error('Error loading more notifications:', error);
              }
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
