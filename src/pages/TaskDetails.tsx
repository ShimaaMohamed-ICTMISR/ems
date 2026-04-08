import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import taskService, { type Task } from "../services/taskService";
import taskDocumentService, {
  type TaskDocument,
} from "../services/projectManagementServices/taskDocumentService";
import memberService, { type ProjectMember } from "../services/memberService";
import hrService, {
  type Employee,
} from "../services/hrProjectManagementService";
import {
  DocumentType,
  PriorityLevel,
  TaskStatus as TaskStatusEnum,
} from "../config/enums";
import type { RootState } from "../store/store";
import "./styles/TaskDetails.css";

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function safeInt(value: string | undefined, fallback = 0): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function safeFloat(value: string | undefined, fallback = 0): number {
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

function getInitials(name?: string | null) {
  if (!name?.trim()) {
    return "UN";
  }

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

type EditTaskFormState = {
  title: string;
  description: string;
  priority: string;
  status: string;
  startDateUtc: string;
  dueDateUtc: string;
  completionPercentage: string;
  effortEstimateHours: string;
  assignedToMemberId: string;
  employerId: string;
};

const initialEditForm: EditTaskFormState = {
  title: "",
  description: "",
  priority: "1",
  status: "0",
  startDateUtc: "",
  dueDateUtc: "",
  completionPercentage: "0",
  effortEstimateHours: "0",
  assignedToMemberId: "",
  employerId: "",
};

const priorityColor: Record<number, string> = {
  1: "#28a745",
  2: "#ffc107",
  3: "#fd7e14",
  4: "#dc3545",
};

const statusColor: Record<number, string> = {
  0: "#6c757d",
  1: "#17a2b8",
  2: "#007bff",
  3: "#dc3545",
  4: "#ffc107",
  5: "#28a745",
  6: "#adb5bd",
};

export function TaskDetails() {
  const navigate = useNavigate();
  const { portfolioId, projectId, taskId } = useParams();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditTaskFormState>(initialEditForm);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(
    null,
  );
  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "5",
    version: "1",
  });
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(
    null,
  );

  function setFormFromTask(data: Task) {
    const taskEmployerId = (data as Task & { employerId?: string | null })
      .employerId;

    const isProjectTask = Boolean(data.projectId || projectId);

    setEditForm({
      title: data.title || "",
      description: data.description || "",
      priority: String(data.priority ?? 1),
      status: String(data.status ?? 0),
      startDateUtc: toDateInputValue(data.startDateUtc),
      dueDateUtc: toDateInputValue(data.dueDateUtc),
      completionPercentage: String(data.completionPercentage ?? 0),
      effortEstimateHours: String(data.effortEstimateHours ?? 0),
      assignedToMemberId: data.assignedToMemberId || "",
      employerId: isProjectTask
        ? taskEmployerId || ""
        : taskEmployerId || data.assignedToMemberId || "",
    });
  }

  useEffect(() => {
    async function fetchTask() {
      if (!taskId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await taskService.getTaskById(taskId);
        setTask(data);
        setFormFromTask(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load task details.");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [taskId]);

  useEffect(() => {
    async function fetchMembers() {
      const pid = task?.projectId || projectId;
      if (!pid) return;
      try {
        const data = await memberService.getProjectMembers(pid);
        setProjectMembers(data);
      } catch (error) {
        console.error("Failed to load project members", error);
      }
    }
    fetchMembers();
  }, [task?.projectId, projectId]);

  useEffect(() => {
    async function fetchEmployees() {
      const withEmployerId = task as
        | (Task & { employerId?: string | null })
        | null;
      const employerId = withEmployerId?.employerId?.trim();
      const isProjectTask = Boolean(task?.projectId || projectId);
      const fallbackEmployerId = !isProjectTask
        ? task?.assignedToMemberId?.trim()
        : undefined;
      const shouldLoad = Boolean(employerId || fallbackEmployerId || isEditing);

      if (isProjectTask) return;
      if (!shouldLoad) return;
      if (employees.length > 0) return;

      try {
        setEmployeesLoading(true);
        const res = await hrService.getEmployees();
        const payload =
          res.data?.data?.data || res.data?.data || res.data || [];
        setEmployees(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Failed to load employees", error);
        toast.error("Failed to load employees for task assignment.");
      } finally {
        setEmployeesLoading(false);
      }
    }

    fetchEmployees();
  }, [isEditing, task, projectId, employees.length]);

  useEffect(() => {
    async function fetchTaskDocuments() {
      if (!taskId) {
        return;
      }

      try {
        setDocumentsLoading(true);
        const docs = await taskDocumentService.getTaskDocuments(taskId);
        setDocuments(docs);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load task documents.");
      } finally {
        setDocumentsLoading(false);
      }
    }

    fetchTaskDocuments();
  }, [taskId]);

  // Close member dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(e.target as Node)
      ) {
        setShowMemberDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getMemberDisplayName(memberId: string) {
    const member = projectMembers.find((m) => m.id === memberId);
    return member ? member.fullName : "";
  }

  function getEmployeeDisplayName(employee: Employee) {
    return `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  }

  function getEmployerId(employee: Employee) {
    const withEmployerId = employee as Employee & { employerId?: string };
    return withEmployerId.employerId || employee.id;
  }

  const employeeLabelByEmployerId = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((employee) => {
      const label =
        getEmployeeDisplayName(employee) ||
        employee.email ||
        employee.employeeCode ||
        employee.id;
      map.set(getEmployerId(employee), label);
    });
    return map;
  }, [employees]);

  const filteredMembers = projectMembers.filter((m) => {
    const search = memberSearch.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(search) ||
      m.role.toLowerCase().includes(search)
    );
  });

  function handleEditInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskId || !task) return;

    if (!task.rowVersion) {
      toast.error("Cannot update task: rowVersion is missing.");
      return;
    }

    if (!editForm.title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    try {
      setSaving(true);

      const isProjectTask = Boolean(task.projectId || projectId);

      await taskService.updateTaskById(taskId, {
        id: taskId,
        projectId: task.projectId || projectId || undefined,
        projectPhaseId: task.projectPhaseId || undefined,
        rowVersion: task.rowVersion,
        milestoneId: task.milestoneId || undefined,
        employerId:
          !isProjectTask && editForm.employerId.trim()
            ? editForm.employerId.trim()
            : undefined,
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        priority: safeInt(editForm.priority, 1),
        status: safeInt(editForm.status),
        startDateUtc: editForm.startDateUtc
          ? new Date(editForm.startDateUtc).toISOString()
          : undefined,
        dueDateUtc: editForm.dueDateUtc
          ? new Date(editForm.dueDateUtc).toISOString()
          : undefined,
        completionPercentage: safeFloat(editForm.completionPercentage),
        effortEstimateHours: safeFloat(editForm.effortEstimateHours),
        assignedToMemberId: editForm.assignedToMemberId.trim() || undefined,
      });

      const refreshed = await taskService.getTaskById(taskId);
      setTask(refreshed);
      setFormFromTask(refreshed);
      setIsEditing(false);
      toast.success("Task updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTask() {
    if (!taskId || !task) return;
    try {
      setSaving(true);
      await taskService.deleteTaskById(taskId);
      toast.success("Task deleted successfully.");
      if (portfolioId && projectId) {
        navigate(`/dashboard/portfolios/${portfolioId}/projects/${projectId}`);
      } else {
        navigate("/dashboard/project-management");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete task.");
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  function goBack() {
    if (portfolioId && projectId) {
      navigate(`/dashboard/portfolios/${portfolioId}/projects/${projectId}`);
    } else {
      navigate("/dashboard/project-management");
    }
  }

  function inferTaskDocumentPath(file: File) {
    return `/tasks/${taskId}/${Date.now()}-${file.name}`;
  }

  async function handleUploadTaskDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!taskId || !task) {
      return;
    }

    if (!selectedUploadFile) {
      toast.error("Please choose a file first.");
      return;
    }

    const resolvedName = uploadForm.name.trim() || selectedUploadFile.name;
    if (!resolvedName) {
      toast.error("Document name is required.");
      return;
    }

    try {
      setUploadingDocument(true);
      const uploadedBy =
        authUser?.fullName ||
        authUser?.username ||
        authUser?.email ||
        "Unknown User";

      await taskDocumentService.uploadTaskDocument(taskId, {
        projectId: task.projectId || undefined,
        name: resolvedName,
        type: parseInt(uploadForm.type, 10),
        filePath: inferTaskDocumentPath(selectedUploadFile),
        version: parseInt(uploadForm.version, 10) || 1,
        uploadedBy,
      });

      toast.success("Task document uploaded.");
      setUploadForm({ name: "", type: "5", version: "1" });
      setSelectedUploadFile(null);
      const refreshed = await taskDocumentService.getTaskDocuments(taskId);
      setDocuments(refreshed);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload task document.");
    } finally {
      setUploadingDocument(false);
    }
  }

  async function handleDeleteTaskDocument(documentId: string) {
    if (!taskId) {
      return;
    }

    try {
      await taskDocumentService.deleteTaskDocument(taskId, documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Task document deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete task document.");
    } finally {
      setConfirmDeleteDocId(null);
    }
  }

  if (loading) {
    return (
      <div className="task-details-loading d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-info" role="status" />
          <p className="mt-3 mb-0">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-details-page">
        <div className="task-details-empty">
          <i className="bi bi-exclamation-triangle" />
          <h2 className="h5 mt-2">Task not found</h2>
          <button
            type="button"
            className="btn btn-info text-white"
            onClick={goBack}
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  const taskEmployerId = (
    task as Task & { employerId?: string | null }
  ).employerId?.trim();
  const isProjectTask = Boolean(task.projectId || projectId);
  const resolvedEmployerId =
    taskEmployerId || (!isProjectTask ? task.assignedToMemberId?.trim() : "");
  const assigneeType = resolvedEmployerId
    ? "hr"
    : task.assignedToMemberId
      ? "member"
      : null;
  const assigneeLabel = resolvedEmployerId
    ? employeeLabelByEmployerId.get(resolvedEmployerId) || resolvedEmployerId
    : task.assignedToMemberId
      ? getMemberDisplayName(task.assignedToMemberId) || task.assignedToMemberId
      : "Unassigned";
  const priorityVal = task.priority ?? 1;
  const statusVal = task.status ?? 0;

  return (
    <div className="task-details-page">
      <section className="task-details-hero mb-4">
        <div>
          <p className="task-details-kicker mb-1">Task Details</p>
          <h1 className="task-details-title mb-2">
            {task.title || "Unnamed task"}
          </h1>
          <div className="task-badge-row">
            <span
              className="task-badge"
              style={{ background: priorityColor[priorityVal] || "#6c757d" }}
            >
              {PriorityLevel[priorityVal] || "Unknown"} Priority
            </span>
            <span
              className="task-badge"
              style={{ background: statusColor[statusVal] || "#6c757d" }}
            >
              {TaskStatusEnum[statusVal] || "Unknown"}
            </span>
            <span className="task-badge task-badge-outline">
              {task.completionPercentage ?? 0}% Complete
            </span>
          </div>
        </div>
        <div className="task-details-actions">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => setIsEditing((prev) => !prev)}
            disabled={saving}
          >
            <i
              className={`bi ${isEditing ? "bi-x-circle" : "bi-pencil-square"} me-2`}
            />
            {isEditing ? "Cancel Edit" : "Edit Task"}
          </button>
          {confirmDelete ? (
            <span className="confirm-inline">
              <span className="confirm-inline-text">Delete this task?</span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDeleteTask}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => setConfirmDelete(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
            >
              <i className="bi bi-trash me-2" />
              Delete
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={goBack}
          >
            <i className="bi bi-arrow-left me-2" />
            {portfolioId && projectId ? "Back to Project" : "Back to Dashboard"}
          </button>
        </div>
      </section>

      {isEditing && (
        <section className="task-edit-card mb-4">
          <h2 className="h6 mb-3">Update Task</h2>
          <form className="row g-3" onSubmit={handleUpdateTask}>
            <div className="col-12 col-lg-6">
              <label className="form-label">Title</label>
              <input
                className="form-control"
                name="title"
                value={editForm.title}
                onChange={handleEditInputChange}
                maxLength={180}
                required
              />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                name="priority"
                value={editForm.priority}
                onChange={handleEditInputChange}
              >
                {Object.entries(PriorityLevel).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="status"
                value={editForm.status}
                onChange={handleEditInputChange}
              >
                {Object.entries(TaskStatusEnum).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Start Date</label>
              <input
                className="form-control"
                type="date"
                name="startDateUtc"
                value={editForm.startDateUtc}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Due Date</label>
              <input
                className="form-control"
                type="date"
                name="dueDateUtc"
                value={editForm.dueDateUtc}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Completion %</label>
              <input
                className="form-control"
                type="number"
                min="0"
                max="100"
                name="completionPercentage"
                value={editForm.completionPercentage}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">Effort Estimate (Hours)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                step="0.5"
                name="effortEstimateHours"
                value={editForm.effortEstimateHours}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12 col-lg-6">
              {task.projectId || projectId ? (
                <>
                  <label className="form-label">
                    Assign To (Project Member)
                  </label>
                  <div
                    className="employee-dropdown-wrap"
                    ref={memberDropdownRef}
                  >
                    <div
                      className="employee-selected-input"
                      onClick={() => setShowMemberDropdown((prev) => !prev)}
                    >
                      {editForm.assignedToMemberId ? (
                        <span className="employee-selected-name">
                          <i className="bi bi-person-fill me-1" />
                          {getMemberDisplayName(editForm.assignedToMemberId) ||
                            editForm.assignedToMemberId}
                          <button
                            type="button"
                            className="employee-clear-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditForm((prev) => ({
                                ...prev,
                                assignedToMemberId: "",
                              }));
                            }}
                          >
                            <i className="bi bi-x" />
                          </button>
                        </span>
                      ) : (
                        <span className="employee-placeholder">
                          Select a project member...
                        </span>
                      )}
                      <i
                        className={`bi bi-chevron-${showMemberDropdown ? "up" : "down"} employee-chevron`}
                      />
                    </div>
                    {showMemberDropdown && (
                      <div className="employee-dropdown-list">
                        <input
                          className="form-control form-control-sm employee-search-input"
                          placeholder="Search by name or role..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          autoFocus
                        />
                        <div className="employee-options">
                          {filteredMembers.length === 0 ? (
                            <div className="employee-option-empty">
                              No project members found. Add members first.
                            </div>
                          ) : (
                            filteredMembers.map((m) => (
                              <div
                                key={m.id}
                                className={`employee-option ${editForm.assignedToMemberId === m.id ? "selected" : ""}`}
                                onClick={() => {
                                  setEditForm((prev) => ({
                                    ...prev,
                                    assignedToMemberId: m.id,
                                  }));
                                  setShowMemberDropdown(false);
                                  setMemberSearch("");
                                }}
                              >
                                <div className="employee-option-avatar">
                                  {m.fullName
                                    .split(" ")
                                    .map((n) => n.charAt(0))
                                    .join("")
                                    .slice(0, 2)}
                                </div>
                                <div className="employee-option-info">
                                  <span className="employee-option-name">
                                    {m.fullName}
                                  </span>
                                  <span className="employee-option-meta">
                                    {m.role}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <label className="form-label">Assign To (HR Employee)</label>
                  <select
                    className="form-select"
                    name="employerId"
                    value={editForm.employerId}
                    onChange={handleEditInputChange}
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
                        <option
                          key={employee.id}
                          value={getEmployerId(employee)}
                        >
                          {fullName}
                        </option>
                      );
                    })}
                  </select>
                </>
              )}
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                name="description"
                value={editForm.description}
                onChange={handleEditInputChange}
                maxLength={2000}
              />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-warning"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="task-details-grid">
        <article className="task-info-card">
          <h2 className="h6">Task Info</h2>
          {/* <div className="task-info-row">
            <span>ID</span>
            <strong>{task.id}</strong>
          </div> */}
          {/* <div className="task-info-row">
            <span>Project ID</span>
            <strong>{task.projectId || "N/A"}</strong>
          </div> */}
          {/* <div className="task-info-row">
            <span>Phase ID</span>
            <strong>{task.projectPhaseId || "N/A"}</strong>
          </div> */}
          {/* <div className="task-info-row">
            <span>Milestone ID</span>
            <strong>{task.milestoneId || "N/A"}</strong>
          </div> */}
          <div className="task-info-row">
            <span>Priority</span>
            <strong style={{ color: priorityColor[priorityVal] }}>
              {PriorityLevel[priorityVal]}
            </strong>
          </div>
          <div className="task-info-row">
            <span>Status</span>
            <strong style={{ color: statusColor[statusVal] }}>
              {TaskStatusEnum[statusVal]}
            </strong>
          </div>
          <div className="task-info-row">
            <span>Completion</span>
            <strong>{task.completionPercentage ?? 0}%</strong>
          </div>
          <div className="task-info-row">
            <span>Effort Estimate</span>
            <strong>{task.effortEstimateHours ?? 0}h</strong>
          </div>
          <div className="task-info-row">
            <span>Assigned To</span>
            <div className="task-assignee-display">
              <strong>{assigneeLabel}</strong>
              {assigneeType && (
                <span
                  className={`task-assignee-badge ${
                    assigneeType === "hr" ? "hr" : "member"
                  }`}
                >
                  {assigneeType === "hr" ? "HR employee" : "Project member"}
                </span>
              )}
            </div>
          </div>
          {!isProjectTask && (
            <div className="task-info-row">
              <span>Employer ID</span>
              <strong>{resolvedEmployerId || "Unassigned"}</strong>
            </div>
          )}
        </article>

        <article className="task-info-card">
          <h2 className="h6">Schedule</h2>
          <div className="task-info-row">
            <span>Start Date</span>
            <strong>{formatDate(task.startDateUtc)}</strong>
          </div>
          <div className="task-info-row">
            <span>Due Date</span>
            <strong>{formatDate(task.dueDateUtc)}</strong>
          </div>
          <div className="task-info-row">
            <span>Created</span>
            <strong>{formatDate(task.createdDateUtc)}</strong>
          </div>
          <div className="task-info-row">
            <span>Updated</span>
            <strong>{formatDate(task.updatedDateUtc)}</strong>
          </div>
        </article>

        <article className="task-info-card task-full-width">
          <h2 className="h6">Description</h2>
          <p className="mb-0">
            {task.description || "No description provided."}
          </p>
        </article>

        <article className="task-info-card task-full-width">
          <h2 className="h6">Progress</h2>
          <div className="task-progress-bar-wrap">
            <div
              className="task-progress-bar"
              style={{
                width: `${Math.min(100, task.completionPercentage ?? 0)}%`,
              }}
            />
          </div>
          <p className="task-progress-label mb-0">
            {task.completionPercentage ?? 0}% complete
          </p>
        </article>

        <article className="task-info-card task-full-width">
          <div className="task-documents-header">
            <h2 className="h6 mb-0">Task Documents</h2>
            <span className="task-documents-count">
              {documents.length} files
            </span>
          </div>

          <form className="row g-3 mt-1" onSubmit={handleUploadTaskDocument}>
            <div className="col-12 col-lg-4">
              <label className="form-label">Document Name</label>
              <input
                className="form-control"
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, name: e.target.value }))
                }
                maxLength={200}
                placeholder="Auto-filled from file name"
              />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={uploadForm.type}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                {Object.entries(DocumentType).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-2">
              <label className="form-label">Version</label>
              <input
                className="form-control"
                type="number"
                min="1"
                value={uploadForm.version}
                onChange={(e) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    version: e.target.value,
                  }))
                }
              />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">File</label>
              <input
                className="form-control"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedUploadFile(file);
                  if (file && !uploadForm.name.trim()) {
                    setUploadForm((prev) => ({ ...prev, name: file.name }));
                  }
                }}
              />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-info text-white"
                disabled={uploadingDocument || !taskId}
              >
                {uploadingDocument ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>

          {documentsLoading ? (
            <div className="task-documents-loading">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="task-documents-empty">
              No documents attached to this task.
            </div>
          ) : (
            <div className="task-documents-list">
              {documents.map((doc) => (
                <div key={doc.id} className="task-document-row">
                  <div className="task-document-main">
                    {(() => {
                      const uploaderName = doc.uploadedBy || "Unknown User";
                      return (
                        <div className="task-document-uploader">
                          <span
                            className="task-document-uploader-avatar"
                            aria-hidden="true"
                          >
                            {getInitials(uploaderName)}
                          </span>
                          <span className="task-document-uploader-name">
                            {uploaderName}
                          </span>
                        </div>
                      );
                    })()}
                    <div className="task-document-name-row">
                      <i className="bi bi-file-earmark-text" />
                      <strong>{doc.name || "Untitled document"}</strong>
                    </div>
                    <div className="task-document-meta">
                      <span>{DocumentType[doc.type ?? 5] || "Other"}</span>
                      <span>v{doc.version ?? 1}</span>
                      <span>
                        {formatDate(doc.uploadedAtUtc || doc.createdDateUtc)}
                      </span>
                    </div>
                    <div className="task-document-path">
                      {doc.filePath || "No file path"}
                    </div>
                  </div>
                  <div className="task-document-actions">
                    {confirmDeleteDocId === doc.id ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteTaskDocument(doc.id)}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setConfirmDeleteDocId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setConfirmDeleteDocId(doc.id)}
                      >
                        <i className="bi bi-trash me-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default TaskDetails;
