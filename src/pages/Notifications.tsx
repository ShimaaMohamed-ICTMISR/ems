import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { notificationService } from "../services/notificationService";
import { setCurrentNotification } from "../store/notificationSlice";
import type { Notification } from "../store/notificationSlice";
import "./Notifications.css";

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

function formatTimeAgo(date?: string): string {
  if (!date) return "Just now";
  const timestamp = new Date(date).getTime();
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function Notifications() {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((state: RootState) => state.notification.notifications);
  const unreadCount = useSelector((state: RootState) => state.notification.unreadCount);
  const user = useSelector((state: RootState) => state.auth.user);
  const [isMarking, setIsMarking] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const filters: any = {};
        if (user?.id) filters.userId = user.id;
        if (priorityFilter) filters.priority = priorityFilter;
        if (categoryFilter) filters.category = categoryFilter;

        const response = await notificationService.getNotifications(undefined, itemsPerPage, currentPage, filters);

        // Extract pagination info from response
        if (response) {
          const total = response.total || 0;
          const pages = response.totalPages || Math.ceil(total / itemsPerPage);

          setTotalItems(total);
          setTotalPages(pages);

          // console.log('Pagination data:', {
          //   total,
          //   totalPages: pages,
          //   currentPage,
          //   itemsPerPage,
          //   response
          // });
        }

        if (user?.id) await notificationService.getUnreadCount(user.id);
      } catch (err) { console.error(err); }
    };
    fetchNotifications();
  }, [user?.id, priorityFilter, categoryFilter, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, categoryFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    // Show pagination info even if only 1 page
    if (validNotifications.length === 0) return null;

    const pages = [];

    // If only 1 page, show simplified pagination
    if (totalPages <= 1) {
      return (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {validNotifications.length} of {totalItems || validNotifications.length} notifications
          </div>
        </div>
      );
    }

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        className="pagination-btn pagination-arrow"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <i className="bi bi-chevron-left"></i>
      </button>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="pagination-btn"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots1" className="pagination-dots">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="pagination-dots">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          className="pagination-btn"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        className="pagination-btn pagination-arrow"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <i className="bi bi-chevron-right"></i>
      </button>
    );

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} notifications
        </div>
        <div className="pagination-controls">
          {pages}
        </div>
      </div>
    );
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setIsMarking(true);
      await notificationService.markAsRead(notificationId);
      if (user?.id) await notificationService.getUnreadCount(user.id);
    } catch (error) { console.error(error); } finally { setIsMarking(false); }
  };

  const handleMarkAllAsRead = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user?.id) return;
    try {
      setIsMarking(true);
      await notificationService.markAllAsRead(user.id);

      // Refresh current page with filters
      const filters: any = {};
      if (user?.id) filters.userId = user.id;
      if (priorityFilter) filters.priority = priorityFilter;
      if (categoryFilter) filters.category = categoryFilter;

      await notificationService.getNotifications(undefined, itemsPerPage, currentPage, filters);
    } catch (error) { console.error(error); } finally { setIsMarking(false); }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      setIsMarking(true);
      await notificationService.deleteNotification(notificationId);
      if (user?.id) await notificationService.getUnreadCount(user.id);
    } catch (error) { console.error(error); } finally { setIsMarking(false); }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotif(notification);
    setShowDetailModal(true);
    dispatch(setCurrentNotification(notification));
  };

  const validNotifications = notifications.filter((n) => (n.subject || n.title));

  return (
    <div className="notifications-container">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <div className="notifications-header">
          <h2 className="mb-1 fw-bold">Notifications</h2>
          <p className="text-muted mb-0">{unreadCount > 0 ? `You have ${unreadCount} unread items` : "You are all caught up!"}</p>
        </div>
        <button
          className="btn shadow-sm fw-semibold d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "#06b6d4", color: "white", minWidth: "160px", height: "42px", position: "relative", zIndex: 10 }}
          onClick={handleMarkAllAsRead}
          disabled={isMarking || unreadCount === 0}
        >
          {isMarking ? (
            <span className="spinner-border spinner-border-sm" role="status"></span>
          ) : (
            <>
              <i className="bi bi-check-all me-2 fs-5"></i>
              <span>Mark all as read</span>
            </>
          )}
        </button>
      </div>

      <div className="row justify-content-center mb-4">
        <div className="col-12 col-xl-10">
          <div className="d-flex gap-3 flex-wrap align-items-center">
            <div className="filter-group">
              <label className="filter-label">
                <i className="bi bi-funnel me-2"></i>
                Priority
              </label>
              <div className="">

                <select
                  className="filter-select-modern"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">🟢 Low</option>
                  <option value="NORMAL">🔵 Normal</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="URGENT">🔴 Urgent</option>
                </select>


              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="bi bi-tag me-2"></i>
                Category
              </label>
              <select
                className="filter-select-modern"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="URGENT">⚡ Urgent</option>
                <option value="INFORMATIONAL">ℹ️ Informational</option>
                <option value="PROMOTIONAL">🎯 Promotional</option>
                <option value="TRANSACTIONAL">💳 Transactional</option>
                <option value="SYSTEM">⚙️ System</option>
              </select>
            </div>

            {(priorityFilter || categoryFilter) && (
              <button
                className="btn-clear-filters"
                onClick={() => {
                  setPriorityFilter("");
                  setCategoryFilter("");
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          {validNotifications.map((notification) => {
            const isUnread = !notification.isRead && !notification.read;
            const config = getNotificationConfig(notification.type);
            const notifId = notification._id || notification.id || "";
            return (
              <div key={notifId} className={`notification-card ${isUnread ? "unread" : ""}`} onClick={() => handleNotificationClick(notification)}>
                <div className="d-flex align-items-start gap-3">
                  <div className="notification-icon-wrapper" style={{ backgroundColor: config.bgColor }}>
                    <i className={`bi ${config.icon}`} style={{ color: config.color }}></i>
                  </div>
                  <div className="flex-grow-1 notification-content">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <h6 className="mb-0 notification-title">{notification.subject || notification.title}</h6>
                      {isUnread && <span className="new-badge">NEW</span>}
                    </div>
                    <p className="mb-2 notification-message">
                      {notification.message || notification.body || notification.content || notification.bodyText}
                    </p>
                    <div className="d-flex align-items-center notification-time">
                      <i className="bi bi-clock me-1"></i>
                      <small>{formatTimeAgo(notification.createdAt || notification.timestamp)}</small>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {validNotifications.length === 0 && (
            <div className="no-notifications">
              <i className="bi bi-inbox" style={{ fontSize: "4rem", color: "#cbd5e1", marginBottom: "1rem" }}></i>
              <h5 style={{ color: "#64748b" }}>No notifications found</h5>
              <p style={{ color: "#94a3b8" }}>Try adjusting your filters or check back later</p>
            </div>
          )}

          {renderPagination()}
        </div>
      </div>

      {showDetailModal && selectedNotif && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Notification Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="notification-detail-section">
                <label className="detail-label">Subject</label>
                <div className="detail-value fw-bold">{selectedNotif.subject || selectedNotif.title}</div>
              </div>

              <div className="notification-detail-section">
                <label className="detail-label">Message</label>
                <div className="detail-value">{selectedNotif.message || selectedNotif.body || selectedNotif.content || selectedNotif.bodyText}</div>
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="notification-detail-section">
                    <label className="detail-label">Priority</label>
                    <div className="detail-value">
                      <span className={`priority-badge priority-${(selectedNotif.priority || 'NORMAL').toLowerCase()}`}>
                        {selectedNotif.priority || "Normal"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="notification-detail-section">
                    <label className="detail-label">Status</label>
                    <div className="detail-value text-capitalize">{selectedNotif.status || "Delivered"}</div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="notification-detail-section">
                    <label className="detail-label">Category</label>
                    <div className="detail-value">
                      <span className={`category-badge category-${(selectedNotif.category || 'SYSTEM').toLowerCase()}`}>
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
                        <i className={`bi ${selectedNotif.channel === 'EMAIL' ? 'bi-envelope-fill' : selectedNotif.channel === 'SMS' ? 'bi-phone-fill' : selectedNotif.channel === 'PUSH' ? 'bi-bell-fill' : 'bi-app-indicator'} me-1`}></i>
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
                  {formatTimeAgo(selectedNotif.createdAt || selectedNotif.timestamp)}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="d-flex gap-2 w-100">
                {(!selectedNotif.isRead && !selectedNotif.read) && (
                  <button
                    className="btn-modal-action btn-mark-read"
                    onClick={(e) => {
                      e.stopPropagation();
                      const notifId = selectedNotif._id || selectedNotif.id;
                      if (notifId) {
                        handleMarkAsRead(notifId);
                        setShowDetailModal(false);
                      }
                    }}
                    disabled={isMarking}
                  >
                    <i className="bi bi-envelope-open me-2"></i>
                    Mark as Read
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
                <button className="btn-modal-action btn-close-modal ms-auto" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}