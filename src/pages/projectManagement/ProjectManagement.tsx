import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import portfolioService from "../../services/projectManagementServices/portfolioService";
import { resourceService } from "../../services/projectManagementServices/resourceService";
import { resourceRequestService } from "../../services/projectManagementServices/resourceService";
import taskService, {
  type TaskCreateDTO,
} from "../../services/projectManagementServices/taskService";
import hrService, {
  type Employee,
} from "../../services/hrProjectManagementService";
import {
  PriorityLevel,
  TaskStatus as TaskStatusEnum,
} from "../../config/enums";
import {
  PM_PERMISSION_KEYS,
  PM_ROUTE_PERMISSION_KEYS,
} from "../../config/projectManagementPermissions";
import { useProjectManagementPermissions } from "../../hooks/useProjectManagementPermissions";
import { AccessDeniedState } from "../../Components/AccessDeniedState";
import { extractApiErrorMessage } from "../../utils/apiError";
import { toUtcDateOnly } from "../../utils/dateOnly";
import ".././styles/ProjectManagement.css";

interface DashboardStats {
  totalPortfolios: number;
  totalProjects: number;
  totalResources: number;
  activeRequests: number;
}

export function ProjectManagement() {
  const navigate = useNavigate();
  const { canAny, hasAnyProjectManagementAccess } =
    useProjectManagementPermissions();

  const canViewPortfolioStats = canAny([...PM_PERMISSION_KEYS.PORTFOLIOS.VIEW]);
  const canViewProjectStats = canAny([...PM_PERMISSION_KEYS.PROJECTS.VIEW]);
  const canViewResourceStats = canAny([...PM_PERMISSION_KEYS.RESOURCES.VIEW]);
  const canViewRequestStats = canAny([
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.VIEW,
  ]);

  const canViewPortfolios = canAny([...PM_ROUTE_PERMISSION_KEYS.PORTFOLIOS]);
  const canAccessResourcesDashboardCard = canAny([
    ...PM_PERMISSION_KEYS.RESOURCES.VIEW,
    ...PM_PERMISSION_KEYS.RESOURCES.CREATE,
    ...PM_PERMISSION_KEYS.RESOURCES.EDIT,
    ...PM_PERMISSION_KEYS.RESOURCES.DELETE,
  ]);
  const canAccessResourceRequestsDashboardCard = canAny([
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.VIEW,
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.CREATE,
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.EDIT,
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.DELETE,
  ]);
  const canCreateQuickTask = canAny([...PM_PERMISSION_KEYS.TASKS.CREATE]);
  const canViewQuickTasks = canAny([...PM_PERMISSION_KEYS.TASKS.VIEW]);

  const [stats, setStats] = useState<DashboardStats>({
    totalPortfolios: 0,
    totalProjects: 0,
    totalResources: 0,
    activeRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "1",
    status: "0",
    startDateUtc: "",
    dueDateUtc: "",
    completionPercentage: "0",
    effortEstimateHours: "0",
    employerId: "",
  });

  function getEmployeeDisplayName(employee: Employee) {
    return `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  }

  function getEmployerId(employee: Employee) {
    const withEmployerId = employee as Employee & { employerId?: string };
    return withEmployerId.employerId || employee.id;
  }

  useEffect(() => {
    async function fetchEmployees() {
      if (!canCreateQuickTask || !showCreateTaskModal || employees.length > 0) {
        return;
      }

      try {
        setEmployeesLoading(true);
        const res = await hrService.getEmployees();
        const payload =
          res.data?.data?.data || res.data?.data || res.data || [];
        setEmployees(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Failed to load employees", error);
        toast.error(
          extractApiErrorMessage(
            error,
            "Failed to load employees for task assignment.",
          ),
        );
      } finally {
        setEmployeesLoading(false);
      }
    }

    fetchEmployees();
  }, [canCreateQuickTask, showCreateTaskModal, employees.length]);

  useEffect(() => {
    async function fetchStats() {
      const nextStats: DashboardStats = {
        totalPortfolios: 0,
        totalProjects: 0,
        totalResources: 0,
        activeRequests: 0,
      };

      try {
        setLoading(true);

        await Promise.all([
          canViewPortfolioStats || canViewProjectStats
            ? portfolioService.getPortfolios().then((portfolios) => {
                nextStats.totalPortfolios = portfolios.length;
                nextStats.totalProjects = portfolios.reduce(
                  (sum, portfolio) => sum + (portfolio.projects?.length || 0),
                  0,
                );
              })
            : Promise.resolve(),
          canViewResourceStats
            ? resourceService.getAll().then((resources) => {
                nextStats.totalResources = resources.length;
              })
            : Promise.resolve(),
          canViewRequestStats
            ? resourceRequestService.getAll().then((requests) => {
                nextStats.activeRequests = requests.filter(
                  (request) => request.status === 0 || request.status === 1,
                ).length;
              })
            : Promise.resolve(),
        ]);

        setStats(nextStats);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }

    if (!hasAnyProjectManagementAccess) {
      setLoading(false);
      return;
    }

    fetchStats();
  }, [
    canViewPortfolioStats,
    canViewProjectStats,
    canViewRequestStats,
    canViewResourceStats,
    hasAnyProjectManagementAccess,
  ]);

  const navCards = useMemo(
    () =>
      [
        {
          icon: "bi-briefcase-fill",
          title: "Portfolios",
          description: "Manage project portfolios and grouped initiatives",
          path: "/dashboard/project-management/portfolios",
          color: "#0ea5e9",
          visible: canViewPortfolios,
        },
        {
          icon: "bi-box-seam",
          title: "Resources",
          description: "Manage people, teams, and equipment allocations",
          path: "/dashboard/project-management/resources",
          color: "#8b5cf6",
          visible: canAccessResourcesDashboardCard,
        },
        {
          icon: "bi-send-check",
          title: "Resource Requests",
          description: "Review and approve resource allocation requests",
          path: "/dashboard/project-management/resource-requests",
          color: "#f59e0b",
          visible: canAccessResourceRequestsDashboardCard,
        },
      ].filter((card) => card.visible),
    [
      canViewPortfolios,
      canAccessResourcesDashboardCard,
      canAccessResourceRequestsDashboardCard,
    ],
  );

  const statWidgets = useMemo(
    () =>
      [
        {
          label: "Total Portfolios",
          value: stats.totalPortfolios,
          icon: "bi-briefcase",
          color: "#0ea5e9",
          visible: canViewPortfolioStats,
        },
        {
          label: "Total Projects",
          value: stats.totalProjects,
          icon: "bi-kanban",
          color: "#10b981",
          visible: canViewProjectStats,
        },
        {
          label: "Resources",
          value: stats.totalResources,
          icon: "bi-box-seam",
          color: "#8b5cf6",
          visible: canViewResourceStats,
        },
        {
          label: "Active Requests",
          value: stats.activeRequests,
          icon: "bi-send-check",
          color: "#f59e0b",
          visible: canViewRequestStats,
        },
      ].filter((widget) => widget.visible),
    [
      canViewPortfolioStats,
      canViewProjectStats,
      canViewRequestStats,
      canViewResourceStats,
      stats.activeRequests,
      stats.totalPortfolios,
      stats.totalProjects,
      stats.totalResources,
    ],
  );

  async function handleCreateIndependentTask(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canCreateQuickTask) {
      toast.error("You do not have permission to create tasks.");
      return;
    }

    if (!newTask.title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    if (
      newTask.startDateUtc &&
      newTask.dueDateUtc &&
      newTask.dueDateUtc <= newTask.startDateUtc
    ) {
      toast.error("Due date must be greater than start date.");
      return;
    }

    try {
      setCreatingTask(true);

      const payload: TaskCreateDTO = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        priority: parseInt(newTask.priority, 10),
        status: parseInt(newTask.status, 10),
        startDateUtc: toUtcDateOnly(newTask.startDateUtc),
        dueDateUtc: toUtcDateOnly(newTask.dueDateUtc),
        completionPercentage: Number(newTask.completionPercentage || 0),
        effortEstimateHours: Number(newTask.effortEstimateHours || 0),
        employerId: newTask.employerId || undefined,
      };

      const created = await taskService.createTask(payload);

      toast.success("Independent task created successfully.");
      setShowCreateTaskModal(false);
      setNewTask({
        title: "",
        description: "",
        priority: "1",
        status: "0",
        startDateUtc: "",
        dueDateUtc: "",
        completionPercentage: "0",
        effortEstimateHours: "0",
        employerId: "",
      });

      if (created.id) {
        navigate(`/dashboard/tasks/${created.id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        extractApiErrorMessage(error, "Failed to create independent task."),
      );
    } finally {
      setCreatingTask(false);
    }
  }

  if (!hasAnyProjectManagementAccess) {
    return (
      <div className="pm-dashboard-page">
        <AccessDeniedState
          title="No Project Management Access"
          description="You do not have permission to access any Project Management module. Please contact your administrator."
        />
      </div>
    );
  }

  return (
    <div className="pm-dashboard-page">
      {/* Hero */}
      <section className="pm-dashboard-hero">
        <div>
          <p className="pm-dashboard-kicker">Project Management</p>
          <h1 className="pm-dashboard-title">Dashboard</h1>
          <p className="pm-dashboard-subtitle">
            Overview of your project management ecosystem. Navigate to modules
            or review key metrics below.
          </p>
        </div>
      </section>

      {/* Stat Widgets */}
      <section className="pm-stat-grid">
        {statWidgets.length === 0 ? (
          <div className="pm-info-note">
            <i className="bi bi-info-circle me-2" />
            You do not have permission to view dashboard metrics.
          </div>
        ) : (
          statWidgets.map((w) => (
            <div key={w.label} className="pm-stat-card">
              <div
                className="pm-stat-icon"
                style={{ background: `${w.color}20`, color: w.color }}
              >
                <i className={`bi ${w.icon}`} />
              </div>
              <div className="pm-stat-info">
                <span className="pm-stat-label">{w.label}</span>
                <span className="pm-stat-value">
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    w.value
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Quick Navigation */}
      <section className="pm-nav-section">
        <h2 className="pm-section-title">
          <i className="bi bi-grid me-2" />
          Quick Navigation
        </h2>
        {navCards.length === 0 ? (
          <div className="pm-info-note">
            <i className="bi bi-info-circle me-2" />
            No module navigation is available for your current permissions.
          </div>
        ) : (
          <div className="pm-nav-grid">
            {navCards.map((card) => (
              <button
                key={card.title}
                type="button"
                className="pm-nav-card"
                onClick={() => navigate(card.path)}
              >
                <div
                  className="pm-nav-card-icon"
                  style={{ background: `${card.color}15`, color: card.color }}
                >
                  <i className={`bi ${card.icon}`} />
                </div>
                <div className="pm-nav-card-body">
                  <h3 className="pm-nav-card-title">{card.title}</h3>
                  <p className="pm-nav-card-desc">{card.description}</p>
                </div>
                <i className="bi bi-chevron-right pm-nav-card-arrow" />
              </button>
            ))}
          </div>
        )}

        {(canCreateQuickTask || canViewQuickTasks) && (
          <div className="pm-quick-actions-row">
            {canCreateQuickTask && (
              <button
                type="button"
                className="pm-quick-action-btn pm-quick-action-create"
                onClick={() => setShowCreateTaskModal(true)}
              >
                <i className="bi bi-lightning-charge-fill me-2" />
                Quick Task
              </button>
            )}

            {canViewQuickTasks && (
              <button
                type="button"
                className="pm-quick-action-btn pm-quick-action-show"
                onClick={() =>
                  navigate("/dashboard/project-management/quick-tasks")
                }
              >
                <i className="bi bi-list-check me-2" />
                View Quick Tasks
              </button>
            )}
          </div>
        )}
      </section>

      {/* Future Widgets Placeholder */}
      <section className="pm-widgets-section">
        <h2 className="pm-section-title">
          <i className="bi bi-bar-chart-line me-2" />
          Insights
        </h2>
        <div className="pm-widgets-grid">
          <div className="pm-widget-placeholder">
            <i className="bi bi-graph-up-arrow" />
            <span>Task Analytics</span>
            <small>Coming soon</small>
          </div>
          <div className="pm-widget-placeholder">
            <i className="bi bi-flag" />
            <span>Milestones Tracking</span>
            <small>Coming soon</small>
          </div>
          <div className="pm-widget-placeholder">
            <i className="bi bi-heart-pulse" />
            <span>Project Health</span>
            <small>Coming soon</small>
          </div>
          <div className="pm-widget-placeholder">
            <i className="bi bi-activity" />
            <span>Activity Feed</span>
            <small>Coming soon</small>
          </div>
        </div>
      </section>

      {showCreateTaskModal && canCreateQuickTask && (
        <div
          className="pm-task-modal-backdrop"
          role="presentation"
          onClick={() => setShowCreateTaskModal(false)}
        >
          <div
            className="pm-task-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Create independent task"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-task-modal-header">
              <div className="pm-task-modal-header-content">
                <span className="pm-task-modal-kicker">
                  <i className="bi bi-lightning-charge-fill me-1" />
                  Quick Task
                </span>
                <h2 className="pm-task-modal-title">Create Independent Task</h2>
                <p className="pm-task-modal-subtitle">
                  This task is not linked to portfolio, project, phase, or
                  milestone.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowCreateTaskModal(false)}
              />
            </div>

            <form
              className="row g-3 pm-task-form"
              onSubmit={handleCreateIndependentTask}
            >
              <div className="col-12">
                <label className="form-label pm-task-label">Title</label>
                <input
                  className="form-control pm-task-input"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  maxLength={180}
                  required
                />
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label pm-task-label">Priority</label>
                <select
                  className="form-select pm-task-input"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                >
                  {Object.entries(PriorityLevel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label pm-task-label">Status</label>
                <select
                  className="form-select pm-task-input"
                  value={newTask.status}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  {Object.entries(TaskStatusEnum).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label pm-task-label">Start Date</label>
                <input
                  type="date"
                  className="form-control pm-task-input"
                  value={newTask.startDateUtc}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      startDateUtc: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label pm-task-label">Due Date</label>
                <input
                  type="date"
                  className="form-control pm-task-input"
                  value={newTask.dueDateUtc}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      dueDateUtc: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label pm-task-label">Completion %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-control pm-task-input"
                  value={newTask.completionPercentage}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      completionPercentage: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label pm-task-label">
                  Effort Estimate (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="form-control pm-task-input"
                  value={newTask.effortEstimateHours}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      effortEstimateHours: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-12">
                <label className="form-label pm-task-label">Assign To</label>
                <select
                  className="form-select pm-task-input"
                  value={newTask.employerId}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      employerId: e.target.value,
                    }))
                  }
                  disabled={employeesLoading}
                >
                  <option value="">
                    {employeesLoading ? "Loading employees..." : "Unassigned"}
                  </option>
                  {employees.map((employee) => {
                    const fullName =
                      getEmployeeDisplayName(employee) ||
                      employee.email ||
                      employee.employeeCode ||
                      employee.id;

                    return (
                      <option key={employee.id} value={getEmployerId(employee)}>
                        {fullName}
                      </option>
                    );
                  })}
                </select>
                {newTask.employerId && (
                  <small className="text-muted d-block mt-1 pm-task-helper">
                    Assigned to:{" "}
                    {(() => {
                      const selected = employees.find(
                        (employee) =>
                          getEmployerId(employee) === newTask.employerId,
                      );

                      if (!selected) {
                        return newTask.employerId;
                      }

                      return (
                        getEmployeeDisplayName(selected) ||
                        selected.email ||
                        selected.employeeCode ||
                        newTask.employerId
                      );
                    })()}
                  </small>
                )}
                {!employeesLoading && employees.length === 0 && (
                  <small className="text-muted d-block mt-1 pm-task-helper">
                    No employees found. You can still create the task as
                    unassigned.
                  </small>
                )}
              </div>
              <div className="col-12">
                <label className="form-label pm-task-label">Description</label>
                <textarea
                  className="form-control pm-task-input"
                  rows={3}
                  maxLength={2000}
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-12 d-flex justify-content-end gap-2 pm-task-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary pm-task-cancel-btn"
                  onClick={() => setShowCreateTaskModal(false)}
                  disabled={creatingTask}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn pm-task-submit-btn"
                  disabled={creatingTask}
                >
                  {creatingTask ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManagement;
