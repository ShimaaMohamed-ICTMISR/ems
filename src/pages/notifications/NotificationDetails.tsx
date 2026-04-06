import { useSelector } from "react-redux";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import notificationService from "../../services/notificationService";
import { formatTimeAgo } from "../../utils";
import type { RootState } from "../../store/store";
import type { Notification } from "../../store/notificationSlice";
import { PollVoteForm } from "../../modules/voting/components/PollVoteForm";
import "./styles.css";

type NotificationWithSourceFields = Notification & {
  sourceEvent?: string;
  sourceEntityId?: string;
  sourceEntityType?: string;
};

function getPollIdFromNotification(n: Notification | undefined): string | undefined {
  if (!n) return undefined;
  const notif = n as NotificationWithSourceFields;
  let meta: unknown = n.metadata;
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta) as unknown;
    } catch {
      meta = undefined;
    }
  }
  if (meta && typeof meta === "object" && meta !== null) {
    const pid = (meta as Record<string, unknown>).pollId;
    if (typeof pid === "string" && pid.trim()) return pid;
  }
  const type = notif.sourceEntityType?.toLowerCase();
  if (
    (type === "poll" || notif.sourceEvent === "PollEligibilityAssigned") &&
    notif.sourceEntityId
  ) {
    return notif.sourceEntityId;
  }
  return undefined;
}

interface Props {
  setShowDetailModal: (value: boolean) => void;
  setIsMarking: (val: boolean) => void;
  isMarking: boolean;
  userId?: string;
  notificationId?: string;
}

export default function NotificationDetails({
  setShowDetailModal,
  setIsMarking,
  isMarking,
  userId,
  notificationId,
}: Props) {
  const selectedNotif = useSelector(
    (state: RootState) => state.notification.notifications,
  ).find((n) => n.id === notificationId || n._id === notificationId);

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

  if (!selectedNotif) return null;

  const pollIdForVote = getPollIdFromNotification(selectedNotif);

  return createPortal(
    <div
      className="modal-overlay notification-details-modal-overlay"
      onClick={() => setShowDetailModal(false)}
    >
      <div
        className="modal-content notification-details-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Notification Details</h2>
          <button
            className="modal-close"
            onClick={() => setShowDetailModal(false)}
          ></button>
        </div>
        <div className="modal-body notification-details-modal-body">
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

          {pollIdForVote && (
            <div className="notification-detail-section notification-poll-vote-wrap mt-3 pt-3 border-top">
              <label className="detail-label d-flex align-items-center gap-2">
                <i className="bi bi-hand-index-thumb" style={{ color: "#06b6d4" }}></i>
                Cast your vote
              </label>
              <p className="small text-muted mb-2">
                Select an option below. You can also use the full voting page if you prefer.
              </p>
              <PollVoteForm
                pollId={pollIdForVote}
                embedded
                onVoteSuccess={() => {
                  toast.success("Vote submitted");
                }}
              />
            </div>
          )}
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
    </div>,
    document.body,
  );
}
