import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../store/store";
import { logout } from "../store/authSlice";
import { authService } from "../services/authService";
import notificationService from "../services/notificationService";
import NotificationSidebar from "../pages/notifications/NotificationSidebar.tsx";

export function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const unreadCount = useSelector(
    (state: RootState) => state.notification.unreadCount,
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] =
    useState(false);

  // Initialize notifications on mount
  useEffect(() => {
    if (!user?.id) return;

    const initializeNotifications = async () => {
      try {
        await notificationService.getUnreadCount(user.id);
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };

    initializeNotifications();

    // Set up streaming
    const cleanup = notificationService.streamNotifications(
      user.id,
      (notification) => {
        console.log("Real-time notification received in Navbar:", notification);
        // Toast is already handled in service if we wanted, but we relies on Redux update
      },
      (error) => {
        console.error("Notification stream error:", error);
      },
      () => {
        console.log("Notification stream connected");
      },
      () => {
        console.log("Notification stream closed");
      },
    );

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still dispatch logout to clear local state even if API fails
      dispatch(logout());
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-dark  shadow-sm"
        style={{ backgroundColor: "#0f172a" }}
      >
        <div
          className="container-fluid px-4 navbar-shell"
          style={{ position: "relative", minHeight: "64px" }}
        >
          {/* Hamburger for mobile */}
          <button
            className="btn btn-link text-white d-lg-none p-0 mobile-sidebar-toggle"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#appSidebar"
            aria-controls="appSidebar"
            aria-label="Toggle navigation"
          >
            <i className="bi bi-list fs-3"></i>
          </button>

          {/* Page Title */}
          <div
            className="navbar-brand mb-0 d-flex align-items-center"
            style={{ minHeight: "50px", maxWidth: "min(44vw, 320px)" }}
          >
            <i
              className="bi bi-stack me-2"
              style={{
                color: "#06b6d4",
                fontSize: "clamp(1rem, 2.2vw, 1.6rem)",
              }}
            ></i>
            <div className="d-flex flex-column lh-sm" style={{ minWidth: 0 }}>
              <span
                className="text-white fw-bold"
                style={{
                  fontSize: "clamp(1rem, 2vw, 1.35rem)",
                  letterSpacing: "0.02em",
                }}
              >
                EMS
              </span>
              <small
                className="text-white-50"
                style={{
                  fontSize: "clamp(0.68rem, 1.1vw, 0.78rem)",
                  whiteSpace: "nowrap",
                }}
              >
                Management System
              </small>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            <button
              className="btn btn-link text-white position-relative p-0 icon-bounce"
              type="button"
              aria-label="Notifications"
              aria-expanded={isNotificationSidebarOpen}
              onClick={() =>
                setIsNotificationSidebarOpen((currentState) => !currentState)
              }
            >
              <i className="bi bi-bell fs-5"></i>
              {unreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                  style={{ backgroundColor: "#cd0606" }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                  <span className="visually-hidden">unread notifications</span>
                </span>
              )}
            </button>
            <div className="dropdown">
              <button
                className="btn btn-link text-white p-0 dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle fs-4"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                <li className="px-3 py-2 text-muted small">
                  <div>{user?.username || user?.email || "User"}</div>
                </li>
                <li>
                  <hr className="dropdown-divider m-0 my-2" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/dashboard/profile")}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                    }}
                  >
                    <i
                      className="bi bi-person me-2"
                      style={{ color: "#06b6d4" }}
                    ></i>
                    Profile
                  </button>
                </li>
                <li>
                  <a className="dropdown-item" href="#">
                    <i className="bi bi-gear me-2 text-secondary"></i>Settings
                  </a>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger border-0 bg-transparent w-100 text-start"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    style={{
                      cursor: isLoggingOut ? "not-allowed" : "pointer",
                      opacity: isLoggingOut ? 0.7 : 1,
                    }}
                  >
                    {isLoggingOut ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Logging out...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </>
                    )}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 991.98px) {
            .navbar-shell {
              min-height: 64px;
              padding-left: 56px !important;
            }
          }
        `}</style>
      </nav>

      <NotificationSidebar
        isOpen={isNotificationSidebarOpen}
        onClose={() => setIsNotificationSidebarOpen(false)}
        userId={user?.id}
        onViewAll={() => {
          setIsNotificationSidebarOpen(false);
          navigate("/dashboard/notifications");
        }}
      />
    </>
  );
}
