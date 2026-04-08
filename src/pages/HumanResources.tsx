import { useNavigate } from "react-router-dom";
import { useHrPermissions } from "../hooks/useHrPermissions";
import { HR_ROUTE_PERMISSION_KEYS } from "../config/hrPermissions";
import { AccessDeniedState } from "../Components/AccessDeniedState";
import "./styles/HumanResources.css";

interface HrModuleCard {
  icon: string;
  title: string;
  description: string;
  path: string;
  color: string;
  permissions: readonly string[];
}

const hrModules: HrModuleCard[] = [
  {
    icon: "bi-building",
    title: "Departments",
    description: "Manage organization departments and structure.",
    path: "/dashboard/hr/departments",
    color: "#0ea5e9",
    permissions: HR_ROUTE_PERMISSION_KEYS.DEPARTMENTS,
  },
  {
    icon: "bi-briefcase",
    title: "Positions",
    description: "Manage job positions and roles.",
    path: "/dashboard/hr/positions",
    color: "#8b5cf6",
    permissions: HR_ROUTE_PERMISSION_KEYS.POSITIONS,
  },
  {
    icon: "bi-people-fill",
    title: "Employees",
    description: "View and manage employee profiles and records.",
    path: "/dashboard/hr/employees",
    color: "#10b981",
    permissions: HR_ROUTE_PERMISSION_KEYS.EMPLOYEES,
  },
  {
    icon: "bi-clock-history",
    title: "Attendance",
    description: "Track check-ins, check-outs, and attendance records.",
    path: "/dashboard/hr/attendance",
    color: "#f59e0b",
    permissions: HR_ROUTE_PERMISSION_KEYS.ATTENDANCE,
  },
  {
    icon: "bi-calendar2-week",
    title: "Leave Types",
    description: "Configure leave type policies and allowances.",
    path: "/dashboard/hr/leave-types",
    color: "#14b8a6",
    permissions: HR_ROUTE_PERMISSION_KEYS.LEAVE_TYPES,
  },
  {
    icon: "bi-envelope-paper",
    title: "Leave Requests",
    description: "Review, approve, and manage leave requests.",
    path: "/dashboard/hr/leave-requests",
    color: "#ef4444",
    permissions: HR_ROUTE_PERMISSION_KEYS.LEAVE_REQUESTS,
  },
  {
    icon: "bi-pie-chart",
    title: "Leave Balances",
    description: "View leave balance breakdown per employee.",
    path: "/dashboard/hr/leave-balances",
    color: "#3b82f6",
    permissions: HR_ROUTE_PERMISSION_KEYS.LEAVE_BALANCES,
  },
];

export function HumanResources() {
  const navigate = useNavigate();
  const { canAny } = useHrPermissions();

  const visibleModules = hrModules.filter((module) =>
    canAny([...module.permissions]),
  );

  return (
    <div className="hr-dashboard-page">
      <section className="hr-dashboard-hero">
        <div>
          <p className="hr-dashboard-kicker">Human Resources</p>
          <h1 className="hr-dashboard-title">Dashboard</h1>
          <p className="hr-dashboard-subtitle">
            Manage employee records, attendance, leave, and core HR workflows
            from one place.
          </p>
        </div>
      </section>

      {visibleModules.length > 0 ? (
        <section className="hr-nav-section">
          <h2 className="hr-section-title">
            <i className="bi bi-grid me-2" />
            Quick Navigation
          </h2>
          <div className="hr-nav-grid">
            {visibleModules.map((mod) => (
              <button
                key={mod.path}
                type="button"
                className="hr-nav-card"
                onClick={() => navigate(mod.path)}
              >
                <div
                  className="hr-nav-card-icon"
                  style={{ background: `${mod.color}15`, color: mod.color }}
                >
                  <i className={`bi ${mod.icon}`} />
                </div>

                <div className="hr-nav-card-body">
                  <h3 className="hr-nav-card-title">{mod.title}</h3>
                  <p className="hr-nav-card-desc">{mod.description}</p>
                  <span
                    className="hr-nav-card-meta"
                    style={{ color: mod.color }}
                  >
                    Open module
                  </span>
                </div>

                <i className="bi bi-chevron-right hr-nav-card-arrow" />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <AccessDeniedState
          title="No HR module access"
          description="Your role does not currently grant access to the available HR modules in this workspace."
        />
      )}
    </div>
  );
}
