import type { Notification } from "../../store/notificationSlice";
import { formatTimeAgo } from "../../utils";

interface Props {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

interface NotificationTypeConfig {
  icon: string;
  color: string;
  bgColor: string;
}

const notificationTypeMap: Record<string, NotificationTypeConfig> = {
  project: {
    icon: "bi-briefcase-fill",
    color: "#1e40af",
    bgColor: "rgba(30, 64, 175, 0.1)",
  },
  meeting: {
    icon: "bi-calendar-event-fill",
    color: "#d97706",
    bgColor: "rgba(217, 119, 6, 0.1)",
  },
  poll: {
    icon: "bi-graph-up",
    color: "#7c3aed",
    bgColor: "rgba(124, 58, 237, 0.1)",
  },
  task: {
    icon: "bi-check-circle-fill",
    color: "#059669",
    bgColor: "rgba(5, 150, 105, 0.1)",
  },
  alert: {
    icon: "bi-exclamation-triangle-fill",
    color: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.1)",
  },
  info: {
    icon: "bi-info-circle-fill",
    color: "#06b6d4",
    bgColor: "rgba(6, 182, 212, 0.1)",
  },
  default: {
    icon: "bi-bell-fill",
    color: "#64748B",
    bgColor: "rgba(100, 116, 139, 0.1)",
  },
};

function getNotificationConfig(type?: string): NotificationTypeConfig {
  const key = type?.toLowerCase() || "default";
  return notificationTypeMap[key] || notificationTypeMap.default;
}

export default function NotificationItem({ notification, onClick }: Props) {
  const isUnread = !notification.isRead && !notification.read;
  const config = getNotificationConfig(notification.type);
  const notifId = notification._id || notification.id || "";

  return (
    <div
      key={notifId}
      className={`notification-card ${isUnread ? "unread" : ""}`}
      onClick={() => onClick(notification)}
    >
      <div className="d-flex align-items-start gap-3">
        <div
          className="notification-icon-wrapper"
          style={{ backgroundColor: config.bgColor }}
        >
          <i
            className={`bi ${config.icon}`}
            style={{ color: config.color }}
          ></i>
        </div>
        <div className="flex-grow-1 notification-content">
          <div className="d-flex align-items-center gap-2 mb-2">
            <h6 className="mb-0 notification-title">
              {notification.subject || notification.title}
            </h6>
            {isUnread && <span className="new-badge">NEW</span>}
          </div>
          <p className="mb-2 notification-message">
            {notification.message ||
              notification.body ||
              notification.content ||
              notification.bodyText}
          </p>
          <div className="d-flex align-items-center notification-time">
            <i className="bi bi-clock me-1"></i>
            <small>
              {formatTimeAgo(notification.createdAt || notification.timestamp)}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
