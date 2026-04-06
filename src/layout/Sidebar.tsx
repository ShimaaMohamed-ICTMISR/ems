// src/layout/Sidebar.tsx
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import type { RootState } from "../store/store";
import finovatelogo from "../assets/images/finovate-logo.webp";
import { useHrPermissions } from "../hooks/useHrPermissions";
import { HR_ROUTE_PERMISSION_KEYS } from "../config/hrPermissions";
import { useProjectManagementPermissions } from "../hooks/useProjectManagementPermissions";
import { PM_ROUTE_PERMISSION_KEYS } from "../config/projectManagementPermissions";
import { useMeetingPermissions } from "../hooks/useMeetingPermissions";
import { MEETING_ROUTE_PERMISSION_KEYS } from "../config/meetingPermissions";
import { useVotingPermissions } from "../hooks/useVotingPermissions";
import { VOTING_ROUTE_PERMISSION_KEYS } from "../config/votingPermissions";

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const mainNavItems: NavItem[] = [
  { to: "/dashboard", icon: "bi-speedometer2", label: "Dashboard" },
  { to: "/dashboard/notifications", icon: "bi-bell", label: "Notifications" },
];

const moduleNavItems: NavItem[] = [
  { to: "/dashboard/hr", icon: "bi-people", label: "Human Resources" },
  { to: "/dashboard/project-management", icon: "bi-kanban", label: "Projects" },
  { to: "/dashboard/meetings", icon: "bi-calendar-event", label: "Meetings" },
  { to: "/dashboard/voting", icon: "bi-bar-chart", label: "Voting & Polls" },
  {
    to: "/dashboard/opportunities",
    icon: "bi-graph-up-arrow",
    label: "Opportunities",
  },
];

const systemNavItems: NavItem[] = [
  { to: "/dashboard/audit-log", icon: "bi-journal-text", label: "Audit Log" },
  { to: "/dashboard/workflows", icon: "bi-diagram-3", label: "Workflows" },
  { to: "/dashboard/settings", icon: "bi-gear", label: "Settings" },
];

const administrationNavItems: NavItem[] = [
  {
    to: "/dashboard/permissions",
    icon: "bi-shield-check",
    label: "Permissions",
  },
  { to: "/dashboard/roles", icon: "bi-lock", label: "Roles" },
  { to: "/dashboard/users", icon: "bi-people-fill", label: "Users" },
];

function NavItems({ items }: { items: NavItem[] }) {
  const handleClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      const offcanvasElement = document.getElementById("appSidebar");
      if (offcanvasElement) {
        const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(
          offcanvasElement,
        );
        if (bsOffcanvas) {
          bsOffcanvas.hide();
        }
      }
    }
  };

  return (
    <>
      {items.map((item) => (
        <li key={item.to} className="nav-item">
          <NavLink
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `nav-link text-white d-flex align-items-center gap-3 px-3 py-2 rounded ${
                isActive ? "fw-semibold shadow-sm" : "hover-bg-white-10"
              }`
            }
            onClick={handleClick}
            style={({ isActive }) => ({
              transition: "all 0.2s ease",
              backgroundColor: isActive
                ? "rgba(6, 182, 212, 0.15)"
                : "transparent",
              borderLeft: isActive
                ? "3px solid #06b6d4"
                : "3px solid transparent",
            })}
          >
            <i className={`bi ${item.icon} fs-5`}></i>
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </>
  );
}

function SidebarContent() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { canAny: canAnyHr } = useHrPermissions();
  const { canAny: canAnyProjectManagement } = useProjectManagementPermissions();
  const { canAny: canAnyMeeting } = useMeetingPermissions();
  const { canAny: canAnyVoting } = useVotingPermissions();

  const visibleModuleNavItems = moduleNavItems.filter((item) => {
    if (item.to === "/dashboard/hr") {
      return canAnyHr([...HR_ROUTE_PERMISSION_KEYS.HR_HOME]);
    }

    if (item.to === "/dashboard/project-management") {
      return canAnyProjectManagement([...PM_ROUTE_PERMISSION_KEYS.HOME]);
    }

    if (item.to === "/dashboard/meetings") {
      return canAnyMeeting([...MEETING_ROUTE_PERMISSION_KEYS.HOME]);
    }

    if (item.to === "/dashboard/voting") {
      return canAnyVoting([...VOTING_ROUTE_PERMISSION_KEYS.HOME]);
    }

    return true;
  });

  return (
    <div
      className="d-flex flex-column"
      style={{ backgroundColor: "#0f172a", minHeight: "100vh", height: "100%" }}
    >
      {/* Logo/Brand */}
      <div className="p-4 border-bottom border-secondary">
        <img
          src={finovatelogo}
          alt="Finovate Logo"
          className="img-fluid"
          style={{
            width: "100%",
            maxWidth: "190px",
            height: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      {/* Navigation */}
      <nav
        className="overflow-auto p-3"
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
        {/* MAIN Section */}
        <div className="mb-4">
          <h6 className="text-uppercase text-white-50 small mb-3 px-2 fw-bold">
            Main
          </h6>
          <ul className="nav flex-column gap-1">
            <NavItems items={mainNavItems} />
          </ul>
        </div>

        {/* MODULES Section */}
        <div className="mb-4">
          <h6 className="text-uppercase text-white-50 small mb-3 px-2 fw-bold">
            Modules
          </h6>
          <ul className="nav flex-column gap-1">
            <NavItems items={visibleModuleNavItems} />
          </ul>
        </div>

        {/* SYSTEM Section */}
        <div className="mb-4">
          <h6 className="text-uppercase text-white-50 small mb-3 px-2 fw-bold">
            System
          </h6>
          <ul className="nav flex-column gap-1">
            <NavItems items={systemNavItems} />
          </ul>
        </div>

        {/* ADMINISTRATION Section */}
        <div className="mb-4">
          <h6 className="text-uppercase text-white-50 small mb-3 px-2 fw-bold">
            Administration
          </h6>
          <ul className="nav flex-column gap-1">
            <NavItems items={administrationNavItems} />
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-top border-secondary mt-auto">
        <div className="d-flex align-items-center text-white">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#06b6d4",
            }}
          >
            <i className="bi bi-person-fill text-white fs-5"></i>
          </div>
          <div>
            <div className="fw-semibold">{user?.fullName}</div>
            <small className="text-white-50">{user?.email}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <div
      className="d-lg-block text-white shadow-sm d-flex flex-column"
      style={{ backgroundColor: "#0f172a", height: "100vh" }}
    >
      <SidebarContent />
    </div>
  );
}

function MobileSidebar() {
  return (
    <div
      className="offcanvas offcanvas-start text-white d-lg-none"
      tabIndex={-1}
      id="appSidebar"
      aria-labelledby="appSidebarLabel"
      style={{ backgroundColor: "#0f172a" }}
    >
      <div className="offcanvas-header border-bottom border-secondary">
        <button
          type="button"
          className="btn-close btn-close-white"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        ></button>
      </div>
      <div className="offcanvas-body p-0 d-flex flex-column">
        <SidebarContent />
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Offcanvas Sidebar */}
      <MobileSidebar />
    </>
  );
}

export function DesktopSidebarOnly() {
  return <DesktopSidebar />;
}

export function MobileSidebarOnly() {
  return <MobileSidebar />;
}
