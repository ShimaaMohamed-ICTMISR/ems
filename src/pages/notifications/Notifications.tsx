import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import { notificationService } from "../../services/notificationService";
import { setCurrentNotification } from "../../store/notificationSlice";
import type { Notification } from "../../store/notificationSlice";
import "./styles.css";
import PrioirtyDropdown from "./PrioirtyDropdown";
import CategoryDropdown from "./CategoryDropdown";
import NotificationItem from "./NotificationItem";
import NotificationDetails from "./NotificationDetails";
import PaginationBar from "../../Components/PaginationBar/PaginationBar";

function Notifications() {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, unreadCount } = useSelector(
    (state: RootState) => state.notification,
  );
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

        const response = await notificationService.getNotifications(
          undefined,
          itemsPerPage,
          currentPage,
          filters,
        );

        // Extract pagination info from response
        if (response) {
          const total = response.total || 0;
          const pages = response.totalPages || Math.ceil(total / itemsPerPage);

          setTotalItems(total);
          setTotalPages(pages);
        }

        if (user?.id) await notificationService.getUnreadCount(user.id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, [user?.id, priorityFilter, categoryFilter, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, categoryFilter]);



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

      await notificationService.getNotifications(
        undefined,
        itemsPerPage,
        currentPage,
        filters,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarking(false);
    }
  };



  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotif(notification);
    setShowDetailModal(true);
    dispatch(setCurrentNotification(notification));
  };

  const validNotifications = notifications.filter((n) => n.subject || n.title);

  return (
    <div className="notifications-container">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <div className="notifications-header">
          <h2 className="mb-1 fw-bold">Notifications</h2>
          <p className="text-muted mb-0">
            {unreadCount > 0
              ? `You have ${unreadCount} unread items`
              : "You are all caught up!"}
          </p>
        </div>
        <button
          className="btn shadow-sm fw-semibold d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "#06b6d4",
            color: "white",
            minWidth: "160px",
            height: "42px",
            position: "relative",
            zIndex: 10,
          }}
          onClick={handleMarkAllAsRead}
          disabled={isMarking || unreadCount === 0}
        >
          {isMarking ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
            ></span>
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
            <PrioirtyDropdown
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value)}
            />
            <CategoryDropdown
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value)}
            />

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
          {validNotifications.map((notification, idx) => (
            <NotificationItem
              key={idx}
              notification={notification}
              onClick={handleNotificationClick}
            />
          ))}

          {validNotifications.length === 0 && (
            <div className="no-notifications">
              <i
                className="bi bi-inbox"
                style={{
                  fontSize: "4rem",
                  color: "#cbd5e1",
                  marginBottom: "1rem",
                }}
              ></i>
              <h5 style={{ color: "#64748b" }}>No notifications found</h5>
              <p style={{ color: "#94a3b8" }}>
                Try adjusting your filters or check back later
              </p>
            </div>
          )}

          {/* render pagination */}
          <PaginationBar
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            loopedItem={validNotifications}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            totalPages={totalPages}
          />
        </div>
      </div>

      {showDetailModal && selectedNotif && (
        <NotificationDetails
          setShowDetailModal={setShowDetailModal}
          isMarking={isMarking}
          selectedNotif={selectedNotif}
          setIsMarking={setIsMarking}
          userId={user?.id}
        />
      )}
    </div>
  );
}

export default Notifications;
