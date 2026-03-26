import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatTimeAgo } from "../../utils";
import notificationService from "../../services/notificationService";
import type { RootState, AppDispatch } from "../../store/store";
import {
  setCurrentNotification,
  type Notification,
} from "../../store/notificationSlice";
import NotificationDetails from "./NotificationDetails";
import "./NotificationSidebar.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onViewAll?: () => void;
}

export default function NotificationSidebar({
  isOpen,
  onClose,
  userId,
  onViewAll,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(
    (state: RootState) => state.notification.notifications,
  );
  const unreadCount = useSelector(
    (state: RootState) => state.notification.unreadCount,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotifId, setSelectedNotifId] = useState<string | undefined>();

  const getNotificationId = (notification: Notification): string =>
    notification.id || notification._id || "";

  const parseBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number")
      return value === 1 ? true : value === 0 ? false : undefined;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "y", "read"].includes(normalized)) return true;
      if (["false", "0", "no", "n", "unread"].includes(normalized))
        return false;
    }
    return undefined;
  };

  const isUnread = (notification: Notification): boolean => {
    // Prefer explicit read flags when available.
    const hasReadFlag = parseBoolean(notification.hasRead);
    if (hasReadFlag !== undefined) return !hasReadFlag;

    const isReadFlag = parseBoolean(notification.isRead);
    if (isReadFlag !== undefined) return !isReadFlag;

    const readFlag = parseBoolean(notification.read);
    if (readFlag !== undefined) return !readFlag;

    const status = notification.status?.toLowerCase();
    if (status === "unread" || status === "new") return true;
    if (status === "read" || status === "opened" || status === "seen")
      return false;

    return !Boolean(notification.readAt);
  };

  const loadNotifications = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      await notificationService.getNotifications(undefined, 20, 1, { userId });
      await notificationService.getUnreadCount(userId);
    } catch (error) {
      console.error("Failed to load notifications in sidebar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadNotifications();
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (showDetailModal) {
        setShowDetailModal(false);
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, showDetailModal]);

  const handleMarkAllAsRead = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (!userId || unreadCount === 0 || isMarking) return;

    try {
      setIsMarking(true);
      await notificationService.markAllAsRead(userId);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleItemClick = async (notification: Notification) => {
    const notificationId = getNotificationId(notification);
    if (!notificationId) return;

    dispatch(setCurrentNotification(notification));
    setSelectedNotifId(notificationId);
    setShowDetailModal(true);

    if (!isUnread(notification)) return;

    try {
      await notificationService.markAsRead(notificationId);
      if (userId) {
        await notificationService.getUnreadCount(userId);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleToggleReadStatus = async (
    event: React.MouseEvent<HTMLButtonElement>,
    notification: Notification,
  ) => {
    event.stopPropagation();

    const notificationId = getNotificationId(notification);
    if (!notificationId || activeActionId) return;

    try {
      setActiveActionId(notificationId);
      if (isUnread(notification)) {
        await notificationService.markAsRead(notificationId);
      } else {
        await notificationService.markAsUnread(notificationId);
      }

      if (userId) {
        await notificationService.getUnreadCount(userId);
      }
    } catch (error) {
      console.error("Failed to toggle notification read status:", error);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDeleteNotification = async (
    event: React.MouseEvent<HTMLButtonElement>,
    notification: Notification,
  ) => {
    event.stopPropagation();

    const notificationId = getNotificationId(notification);
    if (!notificationId || activeActionId) return;

    try {
      setActiveActionId(notificationId);
      await notificationService.deleteNotification(notificationId);

      if (selectedNotifId === notificationId) {
        setShowDetailModal(false);
      }

      if (userId) {
        await notificationService.getUnreadCount(userId);
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <>
      <div
        className={`notification-sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={`notification-sidebar ${isOpen ? "open" : ""}`}
        onClick={(event) => event.stopPropagation()}
        aria-hidden={!isOpen}
      >
        <header className="notification-sidebar-header">
          <div>
            <h5 className="notification-sidebar-title">Notifications</h5>
            <p className="notification-sidebar-subtitle mb-0">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "Everything looks up to date"}
            </p>
          </div>

          <button
            type="button"
            className="notification-sidebar-close"
            aria-label="Close notifications"
            onClick={onClose}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </header>

        <div className="notification-sidebar-actions">
          <button
            type="button"
            className="btn btn-sm  notification-sidebar-mark-all"
            onClick={handleMarkAllAsRead}
            disabled={isMarking || unreadCount === 0}
          >
            {isMarking ? "Updating..." : "Mark all as read"}
          </button>
        </div>

        <div className="notification-sidebar-body">
          {isLoading ? (
            <div className="notification-sidebar-state">
              <span
                className="spinner-border spinner-border-sm"
                role="status"
              />
              <p className="mb-0">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-sidebar-state">
              <i className="bi bi-bell-slash"></i>
              <p className="mb-0">No notifications available</p>
            </div>
          ) : (
            notifications.map((notification, index) => {
              const notificationId = getNotificationId(notification);
              const unread = isUnread(notification);

              return (
                <div
                  key={
                    notificationId ||
                    `${index}-${notification.createdAt || "notification"}`
                  }
                  className={`notification-sidebar-item ${unread ? "unread" : "read"}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleItemClick(notification)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleItemClick(notification);
                    }
                  }}
                >
                  <div className="notification-sidebar-item-head">
                    <h6 className="mb-0 notification-sidebar-item-title">
                      {notification.subject ||
                        notification.title ||
                        "Notification"}
                    </h6>
                    <div className="notification-sidebar-item-actions" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="notification-item-action-btn mark"
                        onClick={(event) => handleToggleReadStatus(event, notification)}
                        disabled={activeActionId === notificationId}
                        title={unread ? "Mark as read" : "Mark as unread"}
                        aria-label={unread ? "Mark as read" : "Mark as unread"}
                      >
                        <i className={`bi ${unread ? "bi-envelope-open" : "bi-envelope"}`}></i>
                      </button>
                      <button
                        type="button"
                        className="notification-item-action-btn delete"
                        onClick={(event) => handleDeleteNotification(event, notification)}
                        disabled={activeActionId === notificationId}
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                    {unread && (
                      <span className="notification-sidebar-unread-indicator">
                        <span className="notification-sidebar-unread-dot" />
                        <span className="notification-sidebar-unread-pill">
                          NEW
                        </span>
                      </span>
                    )}
                  </div>

                  <p className="notification-sidebar-item-message mb-0">
                    {notification.message ||
                      notification.body ||
                      notification.content ||
                      notification.bodyText ||
                      "Open to view details"}
                  </p>

                  <div className="notification-sidebar-item-meta">
                    <small className="notification-sidebar-time">
                      {formatTimeAgo(
                        notification.createdAt || notification.timestamp,
                      )}
                    </small>
                    <small className="notification-sidebar-status">
                      {unread ? "Unread" : "Read"}
                    </small>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="notification-sidebar-footer">
          <button
            type="button"
            className="notification-sidebar-view-all"
            onClick={() => {
              if (onViewAll) {
                onViewAll();
                return;
              }
              onClose();
            }}
          >
            View all notifications
            <i className="bi bi-arrow-right-short"></i>
          </button>
        </footer>
      </aside>

      {showDetailModal && selectedNotifId && (
        <NotificationDetails
          setShowDetailModal={setShowDetailModal}
          setIsMarking={setIsMarking}
          isMarking={isMarking}
          userId={userId}
          notificationId={selectedNotifId}
        />
      )}
    </>
  );
}
