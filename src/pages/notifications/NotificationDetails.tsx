import notificationService from "../../services/notificationService";
import type { Notification } from "../../store/notificationSlice";
import { formatTimeAgo } from "../../utils";

interface Props {
  selectedNotif: Notification;
  setShowDetailModal: (value: boolean) => void;
  setIsMarking: (val: boolean) => void;
  isMarking: boolean;
  userId?: string;
}

export default function NotificationDetails({
  selectedNotif,
  setShowDetailModal,
  setIsMarking,
  isMarking,
  userId,
}: Props) {
  console.log("🚀 ~ NotificationDetails ~ selectedNotif:", selectedNotif);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setIsMarking(true);
      await notificationService.markAsRead(notificationId);
      if (userId) await notificationService.getUnreadCount(userId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleMarkAsUnRead = async (notificationId: string) => {
    try {
      setIsMarking(true);
      await notificationService.markAsUnread(notificationId);
      if (userId) await notificationService.getUnreadCount(userId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      setIsMarking(true);
      await notificationService.deleteNotification(notificationId);
      if (userId) await notificationService.getUnreadCount(userId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Notification Details</h2>
          <button
            className="modal-close"
            onClick={() => setShowDetailModal(false)}
          ></button>
        </div>
        <div className="modal-body">
          <div className="notification-detail-section">
            <label className="detail-label">Subject</label>
            <div className="detail-value fw-bold">
              {selectedNotif.subject || selectedNotif.title}
            </div>
          </div>

          <div className="notification-detail-section">
            <label className="detail-label">Message</label>
            <div className="detail-value">
              {selectedNotif.message ||
                selectedNotif.body ||
                selectedNotif.content ||
                selectedNotif.bodyText}
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="notification-detail-section">
                <label className="detail-label">Priority</label>
                <div className="detail-value">
                  <span
                    className={`priority-badge priority-${(selectedNotif.priority || "NORMAL").toLowerCase()}`}
                  >
                    {selectedNotif.priority || "Normal"}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="notification-detail-section">
                <label className="detail-label">Status</label>
                <div className="detail-value text-capitalize">
                  {selectedNotif.status || "Delivered"}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="notification-detail-section">
                <label className="detail-label">Category</label>
                <div className="detail-value">
                  <span
                    className={`category-badge category-${(selectedNotif.category || "SYSTEM").toLowerCase()}`}
                  >
                    {selectedNotif.category || "System"}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="notification-detail-section">
                <label className="detail-label">Channel</label>
                <div className="detail-value">
                  <span className="channel-badge">
                    <i
                      className={`bi ${selectedNotif.channel === "EMAIL" ? "bi-envelope-fill" : selectedNotif.channel === "SMS" ? "bi-phone-fill" : selectedNotif.channel === "PUSH" ? "bi-bell-fill" : "bi-app-indicator"} me-1`}
                    ></i>
                    {selectedNotif.channel || "In-App"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="notification-detail-section">
            <label className="detail-label">Time</label>
            <div className="detail-value d-flex align-items-center">
              <i className="bi bi-clock me-2" style={{ color: "#64748b" }}></i>
              {formatTimeAgo(
                selectedNotif.createdAt || selectedNotif.timestamp,
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="d-flex gap-2 w-100">
            {!selectedNotif.isRead && (
              <button
                className="btn-modal-action btn-mark-read"
                onClick={(e) => {
                  e.stopPropagation();
                  const notifId = selectedNotif._id || selectedNotif.id;
                  if (notifId) {
                    handleMarkAsRead(notifId);
                  }
                }}
                disabled={isMarking}
              >
                <i className="bi bi-envelope-open me-2"></i>
                Mark as Read
              </button>
            )}

            {selectedNotif.isRead && (
              <button
                className="btn-modal-action btn-mark-read"
                onClick={(e) => {
                  e.stopPropagation();
                  const notifId = selectedNotif._id || selectedNotif.id;
                  if (notifId) {
                    handleMarkAsUnRead(notifId);
                  }
                }}
                disabled={isMarking}
              >
                <i className="bi bi-envelope-open me-2"></i>
                Mark as Un-Read
              </button>
            )}

            <button
              className="btn-modal-action btn-delete-modal"
              onClick={(e) => {
                e.stopPropagation();
                const notifId = selectedNotif._id || selectedNotif.id;
                if (notifId) {
                  handleDelete(notifId);
                  setShowDetailModal(false);
                }
              }}
              disabled={isMarking}
            >
              <i className="bi bi-trash3 me-2"></i>
              Delete
            </button>

            <button
              className="btn-modal-action btn-close-modal ms-auto"
              onClick={() => setShowDetailModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
