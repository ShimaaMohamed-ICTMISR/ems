import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import taskService, {
  type Task,
} from "../../services/projectManagementServices/taskService";
import {
  PriorityLevel,
  TaskStatus as TaskStatusEnum,
} from "../../config/enums";
import ".././styles/QuickTasks.css";

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
}

function isIndependentTask(task: Task) {
  return !task.projectId && !task.projectPhaseId && !task.milestoneId;
}

const statusColor: Record<number, string> = {
  0: "#6b7280",
  1: "#0ea5e9",
  2: "#2563eb",
  3: "#dc2626",
  4: "#f59e0b",
  5: "#16a34a",
  6: "#9ca3af",
};

const priorityColor: Record<number, string> = {
  1: "#16a34a",
  2: "#d97706",
  3: "#ea580c",
  4: "#dc2626",
};

export function QuickTasks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchQuickTasks() {
      try {
        setLoading(true);
        const allTasks = await taskService.getTasks();
        const independentTasks = allTasks
          .filter(isIndependentTask)
          .sort((a, b) => {
            const bTime = new Date(b.createdDateUtc || 0).getTime();
            const aTime = new Date(a.createdDateUtc || 0).getTime();
            return bTime - aTime;
          });

        setTasks(independentTasks);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load quick tasks.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuickTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !lowerSearch ||
        (task.title || "").toLowerCase().includes(lowerSearch) ||
        (task.description || "").toLowerCase().includes(lowerSearch);

      const matchesStatus =
        statusFilter === "all" || String(task.status ?? 0) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => (task.status ?? 0) === 5).length;
    const inProgress = tasks.filter((task) => (task.status ?? 0) === 2).length;
    const blocked = tasks.filter((task) => (task.status ?? 0) === 3).length;

    return { total, done, inProgress, blocked };
  }, [tasks]);

  return (
    <div className="quick-tasks-page">
      <section className="quick-tasks-hero">
        <div>
          <p className="quick-tasks-kicker">Project Management</p>
          <h1 className="quick-tasks-title">Quick Tasks</h1>
          <p className="quick-tasks-subtitle">
            Independent tasks in one workspace, with status and execution focus.
          </p>
        </div>
        <div className="quick-tasks-hero-actions">
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => navigate("/dashboard/project-management")}
          >
            <i className="bi bi-arrow-left me-2" />
            Back to Dashboard
          </button>
        </div>
      </section>

      <section className="quick-tasks-stats">
        <div className="quick-task-stat">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="quick-task-stat">
          <span>In Progress</span>
          <strong>{stats.inProgress}</strong>
        </div>
        <div className="quick-task-stat">
          <span>Done</span>
          <strong>{stats.done}</strong>
        </div>
        <div className="quick-task-stat">
          <span>Blocked</span>
          <strong>{stats.blocked}</strong>
        </div>
      </section>

      <section className="quick-tasks-controls">
        <div className="quick-tasks-search">
          <i className="bi bi-search" />
          <input
            type="text"
            className="form-control"
            placeholder="Search quick tasks by title or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select quick-tasks-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {Object.entries(TaskStatusEnum).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>

      <section className="quick-tasks-list-section">
        {loading ? (
          <div className="quick-tasks-empty">Loading quick tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="quick-tasks-empty">No quick tasks found.</div>
        ) : (
          <div className="quick-tasks-list">
            {filteredTasks.map((task) => {
              const status = task.status ?? 0;
              const priority = task.priority ?? 1;
              return (
                <button
                  key={task.id}
                  type="button"
                  className="quick-task-card"
                  onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                >
                  <div className="quick-task-card-head">
                    <h3>{task.title || "Untitled task"}</h3>
                    <div className="quick-task-badges">
                      <span
                        className="quick-task-badge"
                        style={{
                          background: `${statusColor[status] || "#6b7280"}22`,
                          color: statusColor[status] || "#6b7280",
                        }}
                      >
                        {TaskStatusEnum[status] || "Backlog"}
                      </span>
                      <span
                        className="quick-task-badge"
                        style={{
                          background: `${priorityColor[priority] || "#6b7280"}22`,
                          color: priorityColor[priority] || "#6b7280",
                        }}
                      >
                        {PriorityLevel[priority] || "Low"}
                      </span>
                    </div>
                  </div>

                  <p className="quick-task-desc">
                    {task.description?.trim() || "No description provided."}
                  </p>

                  <div className="quick-task-meta-grid">
                    <span>
                      <i className="bi bi-calendar-event me-1" />
                      Start: {formatDate(task.startDateUtc)}
                    </span>
                    <span>
                      <i className="bi bi-calendar-check me-1" />
                      Due: {formatDate(task.dueDateUtc)}
                    </span>
                    <span>
                      <i className="bi bi-percent me-1" />
                      Completion: {task.completionPercentage ?? 0}%
                    </span>
                    <span>
                      <i className="bi bi-hourglass-split me-1" />
                      Effort: {task.effortEstimateHours ?? 0}h
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuickTasks;
