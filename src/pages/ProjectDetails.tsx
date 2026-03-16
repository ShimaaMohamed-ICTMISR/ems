import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import projectService, { type Project } from "../services/projectService";
import taskService, { type Task } from "../services/taskService";
import phaseService, { type Phase } from "../services/phaseService";
import hrService, {
  type Employee,
} from "../services/hrProjectManagementService";
import memberService, { type ProjectMember } from "../services/memberService";
import financeService, {
  type Budget,
  type BudgetCreateDTO,
} from "../services/financeService";
import {
  resourceRequestService,
  resourceService,
  type ResourceRequest,
  type Resource,
  type ResourceRequestCreateDTO,
} from "../services/resourceService";
import {
  ProjectStage,
  HealthStatus,
  MethodologyType,
  PriorityLevel,
  TaskStatus as TaskStatusEnum,
  BudgetCategory,
  ResourceType,
  RequestStatus,
} from "../config/enums";
import "./styles/ProjectDetails.css";
import "./styles/TaskDetails.css";

function formatDate(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
}

function toDateInputValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function safeInt(value: string | undefined, fallback = 0): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function resolveEmployeeUserId(employee: Employee): string {
  const withUser = employee as Employee & {
    userId?: string;
    user?: { id?: string };
  };

  return withUser.userId?.trim() || withUser.user?.id?.trim() || employee.id;
}

function getEmployeeIdentityCandidates(employee: Employee): string[] {
  const withUser = employee as Employee & {
    userId?: string;
    user?: { id?: string };
  };

  return [
    withUser.userId,
    withUser.user?.id,
    employee.email,
    employee.employeeCode,
    employee.id,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

type EditProjectFormState = {
  name: string;
  objectives: string;
  scope: string;
  startDateUtc: string;
  endDateUtc: string;
  stage: string;
  healthStatus: string;
  methodology: string;
  portfolioId: string;
  templateId: string;
};

const initialEditForm: EditProjectFormState = {
  name: "",
  objectives: "",
  scope: "",
  startDateUtc: "",
  endDateUtc: "",
  stage: "0",
  healthStatus: "2",
  methodology: "1",
  portfolioId: "",
  templateId: "",
};

type ProjectDetailsTab =
  | "overview"
  | "team"
  | "tasks"
  | "phases"
  | "resources"
  | "finance";

export function ProjectDetails() {
  const navigate = useNavigate();
  const { portfolioId, projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] =
    useState<EditProjectFormState>(initialEditForm);
  const [activeTab, setActiveTab] = useState<ProjectDetailsTab>("overview");

  // ── Task state ──
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "1",
    status: "0",
    startDateUtc: "",
    dueDateUtc: "",
    completionPercentage: "0",
    effortEstimateHours: "0",
    assignedToMemberId: "",
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // ── Phase state ──
  const [phases, setPhases] = useState<Phase[]>([]);
  const [phasesLoaded, setPhasesLoaded] = useState(false);
  const [phasesLoading, setPhasesLoading] = useState(false);
  const [showCreatePhase, setShowCreatePhase] = useState(false);
  const [creatingPhase, setCreatingPhase] = useState(false);
  const [newPhase, setNewPhase] = useState({
    name: "",
    startDateUtc: "",
    endDateUtc: "",
    deliverables: "",
    isGatePassed: false,
  });
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editPhaseForm, setEditPhaseForm] = useState({
    name: "",
    startDateUtc: "",
    endDateUtc: "",
    deliverables: "",
    isGatePassed: false,
  });
  const [confirmDeletePhaseId, setConfirmDeletePhaseId] = useState<
    string | null
  >(null);
  const [addingMember, setAddingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberRole, setEditMemberRole] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(
    null,
  );
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  // ── Finance (Budget) state ──
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsLoaded, setBudgetsLoaded] = useState(false);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: "0",
    plannedAmount: "0",
    actualAmount: "0",
    forecastAmount: "0",
  });
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editBudgetForm, setEditBudgetForm] = useState({
    category: "0",
    plannedAmount: "0",
    actualAmount: "0",
    forecastAmount: "0",
  });
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<
    string | null
  >(null);

  // ── Resource Request state ──
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(
    [],
  );
  const [resourceRequestsLoaded, setResourceRequestsLoaded] = useState(false);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [resourceRequestsLoading, setResourceRequestsLoading] = useState(false);
  const [showCreateResourceReq, setShowCreateResourceReq] = useState(false);
  const [creatingResourceReq, setCreatingResourceReq] = useState(false);
  const [newResourceReq, setNewResourceReq] = useState({
    resourceId: "",
    resourceType: "0",
    requestedAllocationPercentage: "50",
    comments: "",
  });
  const [confirmDeleteReqId, setConfirmDeleteReqId] = useState<string | null>(
    null,
  );

  const requestStatusColor: Record<number, string> = {
    0: "#3b82f6",
    1: "#f59e0b",
    2: "#22c55e",
    3: "#ef4444",
    4: "#6b7280",
  };
  const resourceTypeColor: Record<number, string> = {
    0: "#0ea5e9",
    1: "#f59e0b",
    2: "#8b5cf6",
    3: "#10b981",
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

  function setFormFromProject(data: Project) {
    setEditForm({
      name: data.name || "",
      objectives: data.objectives || "",
      scope: data.scope || "",
      startDateUtc: toDateInputValue(data.startDateUtc),
      endDateUtc: toDateInputValue(data.endDateUtc),
      stage: String(data.stage ?? 0),
      healthStatus: String(data.healthStatus ?? 2),
      methodology: String(data.methodology ?? 1),
      portfolioId: data.portfolioId || "",
      templateId: data.templateId || "",
    });
  }

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await projectService.getProjectById(projectId);
        setProject(data);
        setFormFromProject(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load project details.");
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId]);

  useEffect(() => {
    setTasksLoaded(false);
    setPhasesLoaded(false);
    setMembersLoaded(false);
    setEmployeesLoaded(false);
    setResourceRequestsLoaded(false);
    setBudgetsLoaded(false);
    setActiveTab("overview");
  }, [projectId]);

  // ── Fetch tasks ──
  useEffect(() => {
    async function fetchTasks() {
      if (!projectId || activeTab !== "tasks" || tasksLoaded) return;
      try {
        setTasksLoading(true);
        const data = await taskService.getTasks(projectId);
        setTasks(data);
        setTasksLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setTasksLoading(false);
      }
    }
    fetchTasks();
  }, [projectId, activeTab, tasksLoaded]);

  // ── Fetch phases ──
  useEffect(() => {
    async function fetchPhases() {
      if (!projectId || activeTab !== "phases" || phasesLoaded) return;
      try {
        setPhasesLoading(true);
        const data = await phaseService.getPhases(projectId);
        setPhases(data);
        setPhasesLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setPhasesLoading(false);
      }
    }
    fetchPhases();
  }, [projectId, activeTab, phasesLoaded]);

  // ── Fetch resource requests ──
  useEffect(() => {
    async function fetchResourceRequests() {
      if (!projectId || activeTab !== "resources" || resourceRequestsLoaded)
        return;
      try {
        setResourceRequestsLoading(true);
        const [reqData, resData] = await Promise.all([
          resourceRequestService.getAll(projectId),
          resourceService.getAll(),
        ]);
        setResourceRequests(reqData);
        setAllResources(resData);
        setResourceRequestsLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setResourceRequestsLoading(false);
      }
    }
    fetchResourceRequests();
  }, [projectId, activeTab, resourceRequestsLoaded]);

  // ── Fetch budgets ──
  useEffect(() => {
    async function fetchBudgets() {
      if (!projectId || activeTab !== "finance" || budgetsLoaded) return;
      try {
        setBudgetsLoading(true);
        const data = await financeService.getBudgets(projectId);
        setBudgets(data);
        setBudgetsLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setBudgetsLoading(false);
      }
    }
    fetchBudgets();
  }, [projectId, activeTab, budgetsLoaded]);

  // ── Fetch employees (for adding to project) ──
  useEffect(() => {
    async function fetchEmployees() {
      if (activeTab !== "team" || employeesLoaded) return;
      try {
        const res = await hrService.getEmployees();
        const payload =
          res.data?.data?.data || res.data?.data || res.data || [];
        setEmployees(Array.isArray(payload) ? payload : []);
        setEmployeesLoaded(true);
      } catch (error) {
        console.error("Failed to load employees", error);
      }
    }
    fetchEmployees();
  }, [activeTab, employeesLoaded]);

  // ── Fetch project members ──
  async function refreshMembers() {
    if (!projectId) return;
    try {
      setMembersLoading(true);
      const data = await memberService.getProjectMembers(projectId);
      setProjectMembers(data);
      setMembersLoaded(true);
    } catch (error) {
      console.error("Failed to load project members", error);
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "team" && !membersLoaded) {
      refreshMembers();
    }
  }, [projectId, activeTab, membersLoaded]);

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
    if (!member) return "";
    const emp = employees.find(
      (e) => resolveEmployeeUserId(e) === member.userId,
    );
    return emp ? `${emp.firstName} ${emp.lastName}` : member.fullName;
  }

  // Employees not yet added to the project
  const availableEmployees = employees.filter((e) => {
    const identityCandidates = getEmployeeIdentityCandidates(e);
    return !projectMembers.some(
      (m) =>
        identityCandidates.includes((m.userId || "").trim()) ||
        m.fullName === `${e.firstName} ${e.lastName}`,
    );
  });
  const filteredAvailableEmployees = availableEmployees.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    const search = employeeSearch.toLowerCase();
    return (
      fullName.includes(search) ||
      (e.email?.toLowerCase().includes(search) ?? false)
    );
  });

  // Filter members for task assignment dropdown
  const filteredMembers = projectMembers.filter((m) => {
    const search = memberSearch.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(search) ||
      m.role.toLowerCase().includes(search)
    );
  });

  // ── Member CRUD ──
  async function handleAddMemberFromEmployee(emp: Employee) {
    if (!projectId) return;
    try {
      setAddingMember(true);

      const resolvedUserId = resolveEmployeeUserId(emp);
      const fullName = `${emp.firstName} ${emp.lastName}`;
      const identityCandidates = getEmployeeIdentityCandidates(emp);
      const alreadyExists = projectMembers.some(
        (member) =>
          identityCandidates.includes((member.userId || "").trim()) ||
          member.fullName === fullName,
      );

      if (alreadyExists) {
        toast("This employee is already a project member.");
        return;
      }

      const created = await memberService.createProjectMember({
        projectId,
        userId: resolvedUserId,
        fullName,
        role: emp.position?.title || "Member",
      });
      setProjectMembers((prev) => [...prev, created]);
      await refreshMembers();
      toast.success(`${emp.firstName} ${emp.lastName} added to project.`);
    } catch (error) {
      console.error(error);
      const axiosErr = error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (axiosErr.response?.status === 409) {
        await refreshMembers();
        toast.error(
          axiosErr.response?.data?.message ||
            "Backend constraint is blocking additional members for this project (409).",
        );
      } else {
        toast.error("Failed to add member.");
      }
    } finally {
      setAddingMember(false);
    }
  }

  async function handleUpdateMemberRole(member: ProjectMember) {
    if (!editMemberRole.trim()) return;
    try {
      // Fetch full member to get all required fields (list endpoint may omit userId/rowVersion)
      const full = await memberService.getMemberById(member.id);
      await memberService.updateMember(member.id, {
        id: member.id,
        projectId: full.projectId || member.projectId,
        userId: full.userId || member.userId || member.id,
        fullName: full.fullName || member.fullName,
        role: editMemberRole.trim(),
        rowVersion: full.rowVersion || member.rowVersion || "",
      });
      toast.success("Member updated.");
      setEditingMemberId(null);
      await refreshMembers();
    } catch (error: unknown) {
      console.error(error);
      const axiosErr = error as {
        response?: { data?: unknown; status?: number };
      };
      const detail = axiosErr.response?.data;
      const msg =
        typeof detail === "string"
          ? detail
          : detail && typeof detail === "object" && "title" in detail
            ? (detail as { title: string }).title
            : "Failed to update member.";
      toast.error(msg);
    }
  }

  async function handleDeleteMember(member: ProjectMember) {
    const confirmed = window.confirm(
      `Remove ${member.fullName} from the project?`,
    );
    if (!confirmed) return;
    try {
      // Fetch full member to get rowVersion (may be needed for optimistic concurrency)
      const full = await memberService.getMemberById(member.id);
      await memberService.deleteMember(
        member.id,
        full.rowVersion || member.rowVersion || undefined,
      );
      setProjectMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success("Member removed.");
    } catch (error: unknown) {
      console.error(error);
      const axiosErr = error as {
        response?: { data?: unknown; status?: number };
      };
      const detail = axiosErr.response?.data;
      const msg =
        typeof detail === "string"
          ? detail
          : detail && typeof detail === "object" && "title" in detail
            ? (detail as { title: string }).title
            : "Failed to remove member.";
      toast.error(msg);
    }
  }

  function handleEditInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId || !project) {
      return;
    }

    if (!project.rowVersion) {
      toast.error("Cannot update project: rowVersion is missing.");
      return;
    }

    if (!editForm.name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    try {
      setSaving(true);
      await projectService.updateProjectById(projectId, {
        id: projectId,
        rowVersion: project.rowVersion,
        name: editForm.name.trim(),
        objectives: editForm.objectives.trim() || undefined,
        scope: editForm.scope.trim() || undefined,
        startDateUtc: editForm.startDateUtc
          ? new Date(editForm.startDateUtc).toISOString()
          : undefined,
        endDateUtc: editForm.endDateUtc
          ? new Date(editForm.endDateUtc).toISOString()
          : undefined,
        stage: safeInt(editForm.stage),
        healthStatus: safeInt(editForm.healthStatus),
        methodology: safeInt(editForm.methodology),
        portfolioId: editForm.portfolioId.trim() || undefined,
        templateId: editForm.templateId.trim() || undefined,
      });

      const refreshed = await projectService.getProjectById(projectId);
      setProject(refreshed);
      setFormFromProject(refreshed);
      setIsEditing(false);
      toast.success("Project updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject() {
    if (!projectId || !project) return;
    try {
      setSaving(true);
      await projectService.deleteProjectById(projectId);
      toast.success("Project deleted successfully.");
      navigate("/portfolios");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project.");
    } finally {
      setSaving(false);
      setConfirmDeleteProject(false);
    }
  }

  // ── Task CRUD handlers ──
  function handleNewTaskChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;
    if (!newTask.title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    try {
      setCreatingTask(true);

      await taskService.createTask({
        projectId,
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        priority: safeInt(newTask.priority, 1),
        status: safeInt(newTask.status),
        startDateUtc: newTask.startDateUtc
          ? new Date(newTask.startDateUtc).toISOString()
          : undefined,
        dueDateUtc: newTask.dueDateUtc
          ? new Date(newTask.dueDateUtc).toISOString()
          : undefined,
        completionPercentage: parseFloat(newTask.completionPercentage) || 0,
        effortEstimateHours: parseFloat(newTask.effortEstimateHours) || 0,
        assignedToMemberId: newTask.assignedToMemberId.trim() || undefined,
      });
      toast.success("Task created successfully.");
      setNewTask({
        title: "",
        description: "",
        priority: "1",
        status: "0",
        startDateUtc: "",
        dueDateUtc: "",
        completionPercentage: "0",
        effortEstimateHours: "0",
        assignedToMemberId: "",
      });
      setShowCreateTask(false);
      const refreshed = await taskService.getTasks(projectId);
      setTasks(refreshed);
      setTasksLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create task.");
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await taskService.deleteTaskById(taskId);
      toast.success("Task deleted.");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete task.");
    } finally {
      setConfirmDeleteTaskId(null);
    }
  }

  // ── Phase CRUD handlers ──
  function handleNewPhaseChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      setNewPhase((prev) => ({
        ...prev,
        [name]: (event.target as HTMLInputElement).checked,
      }));
    } else {
      setNewPhase((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleCreatePhase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;
    if (!newPhase.name.trim()) {
      toast.error("Phase name is required.");
      return;
    }
    try {
      setCreatingPhase(true);
      await phaseService.createPhase({
        projectId,
        name: newPhase.name.trim(),
        startDateUtc: newPhase.startDateUtc
          ? new Date(newPhase.startDateUtc).toISOString()
          : undefined,
        endDateUtc: newPhase.endDateUtc
          ? new Date(newPhase.endDateUtc).toISOString()
          : undefined,
        deliverables: newPhase.deliverables.trim() || undefined,
        isGatePassed: newPhase.isGatePassed,
      });
      toast.success("Phase created successfully.");
      setNewPhase({
        name: "",
        startDateUtc: "",
        endDateUtc: "",
        deliverables: "",
        isGatePassed: false,
      });
      setShowCreatePhase(false);
      const refreshed = await phaseService.getPhases(projectId);
      setPhases(refreshed);
      setPhasesLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create phase.");
    } finally {
      setCreatingPhase(false);
    }
  }

  function startEditPhase(phase: Phase) {
    setEditingPhaseId(phase.id);
    setEditPhaseForm({
      name: phase.name || "",
      startDateUtc: toDateInputValue(phase.startDateUtc),
      endDateUtc: toDateInputValue(phase.endDateUtc),
      deliverables: phase.deliverables || "",
      isGatePassed: phase.isGatePassed ?? false,
    });
  }

  function handleEditPhaseChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      setEditPhaseForm((prev) => ({
        ...prev,
        [name]: (event.target as HTMLInputElement).checked,
      }));
    } else {
      setEditPhaseForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleUpdatePhase(phase: Phase) {
    if (!projectId || !editPhaseForm.name.trim()) {
      toast.error("Phase name is required.");
      return;
    }
    try {
      const full = await phaseService.getPhaseById(phase.id);
      await phaseService.updatePhase(phase.id, {
        id: phase.id,
        projectId,
        rowVersion: full.rowVersion || phase.rowVersion || "",
        name: editPhaseForm.name.trim(),
        startDateUtc: editPhaseForm.startDateUtc
          ? new Date(editPhaseForm.startDateUtc).toISOString()
          : undefined,
        endDateUtc: editPhaseForm.endDateUtc
          ? new Date(editPhaseForm.endDateUtc).toISOString()
          : undefined,
        deliverables: editPhaseForm.deliverables.trim() || undefined,
        isGatePassed: editPhaseForm.isGatePassed,
      });
      toast.success("Phase updated.");
      setEditingPhaseId(null);
      const refreshed = await phaseService.getPhases(projectId);
      setPhases(refreshed);
      setPhasesLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update phase.");
    }
  }

  async function handleDeletePhase(phaseId: string) {
    try {
      await phaseService.deletePhase(phaseId);
      toast.success("Phase deleted.");
      setPhases((prev) => prev.filter((p) => p.id !== phaseId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete phase.");
    } finally {
      setConfirmDeletePhaseId(null);
    }
  }

  // ── Resource Request Handlers ──

  function handleNewResourceReqChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    if (name === "resourceId") {
      const selected = allResources.find((r) => r.id === value);
      setNewResourceReq((prev) => ({
        ...prev,
        resourceId: value,
        resourceType: selected ? String(selected.type ?? 0) : prev.resourceType,
      }));
    } else {
      setNewResourceReq((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleCreateResourceReq(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    try {
      setCreatingResourceReq(true);
      const payload: ResourceRequestCreateDTO = {
        projectId,
        resourceId: newResourceReq.resourceId || undefined,
        resourceType: parseInt(newResourceReq.resourceType, 10),
        requestedAllocationPercentage:
          parseInt(newResourceReq.requestedAllocationPercentage, 10) || 50,
        comments: newResourceReq.comments || undefined,
      };
      await resourceRequestService.create(payload);
      toast.success("Resource request created!");
      setNewResourceReq({
        resourceId: "",
        resourceType: "0",
        requestedAllocationPercentage: "50",
        comments: "",
      });
      setShowCreateResourceReq(false);
      const data = await resourceRequestService.getAll(projectId);
      setResourceRequests(data);
      setResourceRequestsLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create resource request.");
    } finally {
      setCreatingResourceReq(false);
    }
  }

  async function handleDeleteResourceReq(id: string) {
    try {
      await resourceRequestService.delete(id);
      toast.success("Resource request deleted.");
      setResourceRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete resource request.");
    } finally {
      setConfirmDeleteReqId(null);
    }
  }

  function getResourceName(resourceId?: string | null) {
    if (!resourceId) return "—";
    const r = allResources.find((res) => res.id === resourceId);
    return r?.name || resourceId;
  }

  function openDocumentsWorkspace() {
    const resolvedPortfolioId = portfolioId || project?.portfolioId;

    if (!resolvedPortfolioId || !project?.id) {
      toast.error("Missing portfolio or project information.");
      return;
    }

    navigate(
      `/portfolios/${resolvedPortfolioId}/projects/${project.id}/documents`,
    );
  }

  // ── Budget handlers ──

  function handleNewBudgetChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setNewBudget((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditBudgetChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setEditBudgetForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;

    const category = safeInt(newBudget.category);
    const duplicate = budgets.some((b) => (b.category ?? 0) === category);
    if (duplicate) {
      toast.error(
        "A budget for this category already exists for this project.",
      );
      return;
    }

    try {
      setCreatingBudget(true);
      const payload: BudgetCreateDTO = {
        projectId,
        category,
        plannedAmount: parseFloat(newBudget.plannedAmount) || 0,
        actualAmount: parseFloat(newBudget.actualAmount) || 0,
        forecastAmount: parseFloat(newBudget.forecastAmount) || 0,
      };

      await financeService.createBudget(payload);
      toast.success("Budget created successfully.");
      setNewBudget({
        category: "0",
        plannedAmount: "0",
        actualAmount: "0",
        forecastAmount: "0",
      });
      setShowCreateBudget(false);
      const refreshed = await financeService.getBudgets(projectId);
      setBudgets(refreshed);
      setBudgetsLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create budget.");
    } finally {
      setCreatingBudget(false);
    }
  }

  function startEditBudget(budget: Budget) {
    setEditingBudgetId(budget.id);
    setEditBudgetForm({
      category: String(budget.category ?? 0),
      plannedAmount: String(budget.plannedAmount ?? 0),
      actualAmount: String(budget.actualAmount ?? 0),
      forecastAmount: String(budget.forecastAmount ?? 0),
    });
  }

  async function handleUpdateBudget(budget: Budget) {
    if (!projectId) return;

    const category = safeInt(editBudgetForm.category);
    const duplicate = budgets.some(
      (b) => b.id !== budget.id && (b.category ?? 0) === category,
    );
    if (duplicate) {
      toast.error(
        "A budget for this category already exists for this project.",
      );
      return;
    }

    try {
      const latest = await financeService.getBudgetById(budget.id);
      await financeService.updateBudgetById(budget.id, {
        id: budget.id,
        projectId,
        rowVersion: latest.rowVersion || budget.rowVersion || "",
        category,
        plannedAmount: parseFloat(editBudgetForm.plannedAmount) || 0,
        actualAmount: parseFloat(editBudgetForm.actualAmount) || 0,
        forecastAmount: parseFloat(editBudgetForm.forecastAmount) || 0,
      });
      toast.success("Budget updated.");
      setEditingBudgetId(null);
      const refreshed = await financeService.getBudgets(projectId);
      setBudgets(refreshed);
      setBudgetsLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update budget.");
    }
  }

  async function handleDeleteBudget(budgetId: string) {
    try {
      await financeService.deleteBudgetById(budgetId);
      toast.success("Budget deleted.");
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete budget.");
    } finally {
      setConfirmDeleteBudgetId(null);
    }
  }

  const usedBudgetCategories = new Set(
    budgets
      .map((b) => b.category)
      .filter((v): v is number => typeof v === "number"),
  );

  const availableBudgetCategoryEntries = Object.entries(BudgetCategory).filter(
    ([value]) => !usedBudgetCategories.has(parseInt(value, 10)),
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const budgetChartData = useMemo(
    () =>
      budgets.map((b) => ({
        category: BudgetCategory[b.category ?? 0] || "Unknown",
        planned: b.plannedAmount ?? 0,
        actual: b.actualAmount ?? 0,
        forecast: b.forecastAmount ?? 0,
      })),
    [budgets],
  );

  const budgetDistributionData = useMemo(
    () =>
      budgets.map((b) => ({
        name: BudgetCategory[b.category ?? 0] || "Unknown",
        value: b.plannedAmount ?? 0,
      })),
    [budgets],
  );

  const budgetConsumptionData = useMemo(
    () =>
      budgets.map((b) => {
        const planned = b.plannedAmount ?? 0;
        const actual = b.actualAmount ?? 0;
        const percent = planned > 0 ? (actual / planned) * 100 : 0;

        return {
          id: b.id,
          category: BudgetCategory[b.category ?? 0] || "Unknown",
          planned,
          actual,
          percent,
        };
      }),
    [budgets],
  );

  const chartPalette = [
    "#1b4965",
    "#189ab4",
    "#76c893",
    "#ffb703",
    "#fb8500",
    "#8ecae6",
    "#2a9d8f",
    "#e76f51",
  ];

  if (loading) {
    return (
      <div className="project-details-loading d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-info" role="status" />
          <p className="mt-3 mb-0">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-details-page">
        <div className="project-details-empty">
          <i className="bi bi-exclamation-triangle" />
          <h2 className="h5 mt-2">Project not found</h2>
          <button
            type="button"
            className="btn btn-info text-white"
            onClick={() => navigate("/portfolios")}
          >
            Back to Portfolios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-details-page">
      <section className="project-details-hero mb-4">
        <div>
          <p className="project-details-kicker mb-2">Portfolio Project</p>
          <h1 className="project-details-title mb-2">
            {project.name || "Unnamed project"}
          </h1>
          {/* <p className="project-details-subtitle mb-0">
            Portfolio ID: {portfolioId || project.portfolioId || "N/A"}
          </p> */}
        </div>
        <div className="project-details-actions">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => setIsEditing((prev) => !prev)}
            disabled={saving}
          >
            <i
              className={`bi ${isEditing ? "bi-x-circle" : "bi-pencil-square"} me-2`}
            />
            {isEditing ? "Cancel Edit" : "Edit Project"}
          </button>
          {confirmDeleteProject ? (
            <span className="confirm-inline">
              <span className="confirm-inline-text">Delete this project?</span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDeleteProject}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => setConfirmDeleteProject(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setConfirmDeleteProject(true)}
              disabled={saving}
            >
              <i className="bi bi-trash me-2" />
              Delete Project
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => navigate("/portfolios")}
          >
            <i className="bi bi-arrow-left me-2" />
            Back to Portfolios
          </button>
        </div>
      </section>

      <section
        className="project-tabs-bar mb-3"
        role="tablist"
        aria-label="Project sections"
      >
        <button
          type="button"
          className={`project-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <i className="bi bi-grid-1x2 me-2" />
          Overview
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === "team" ? "active" : ""}`}
          onClick={() => setActiveTab("team")}
        >
          <i className="bi bi-people me-2" />
          Team
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <i className="bi bi-check2-square me-2" />
          Tasks
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === "phases" ? "active" : ""}`}
          onClick={() => setActiveTab("phases")}
        >
          <i className="bi bi-layers me-2" />
          Phases
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === "resources" ? "active" : ""}`}
          onClick={() => setActiveTab("resources")}
        >
          <i className="bi bi-box-seam me-2" />
          Resources
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === "finance" ? "active" : ""}`}
          onClick={() => setActiveTab("finance")}
        >
          <i className="bi bi-cash-coin me-2" />
          Finance
        </button>
      </section>

      {isEditing && (
        <section className="details-card mb-4">
          <h2 className="h6 mb-3">Update Project (PUT /project/:id)</h2>
          <form className="row g-3" onSubmit={handleUpdateProject}>
            <div className="col-12 col-lg-6">
              <label className="form-label">Project Name</label>
              <input
                className="form-control"
                name="name"
                value={editForm.name}
                onChange={handleEditInputChange}
                required
              />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">Portfolio ID</label>
              <input
                className="form-control"
                name="portfolioId"
                value={editForm.portfolioId}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Stage</label>
              <select
                className="form-select"
                name="stage"
                value={editForm.stage}
                onChange={handleEditInputChange}
              >
                {Object.entries(ProjectStage).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Health</label>
              <select
                className="form-select"
                name="healthStatus"
                value={editForm.healthStatus}
                onChange={handleEditInputChange}
              >
                {Object.entries(HealthStatus).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Methodology</label>
              <select
                className="form-select"
                name="methodology"
                value={editForm.methodology}
                onChange={handleEditInputChange}
              >
                {Object.entries(MethodologyType).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">Start Date</label>
              <input
                className="form-control"
                type="date"
                name="startDateUtc"
                value={editForm.startDateUtc}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">End Date</label>
              <input
                className="form-control"
                type="date"
                name="endDateUtc"
                value={editForm.endDateUtc}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">Template ID (Optional)</label>
              <input
                className="form-control"
                name="templateId"
                value={editForm.templateId}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Objectives</label>
              <textarea
                className="form-control"
                rows={2}
                name="objectives"
                value={editForm.objectives}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Scope</label>
              <textarea
                className="form-control"
                rows={2}
                name="scope"
                value={editForm.scope}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-warning"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Update"}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === "overview" && (
        <section className="project-details-grid">
          <article className="details-card">
            <h2 className="h6">Project Overview</h2>
            {/* <div className="details-row">
              <span>ID</span>
              <strong>{project.id}</strong>
            </div> */}
            <div className="details-row">
              <span>Stage</span>
              <strong>{ProjectStage[project.stage ?? 0]}</strong>
            </div>
            <div className="details-row">
              <span>Health</span>
              <strong>{HealthStatus[project.healthStatus ?? 0]}</strong>
            </div>
            <div className="details-row">
              <span>Methodology</span>
              <strong>{MethodologyType[project.methodology ?? 0]}</strong>
            </div>
            {/* <div className="details-row">
              <span>Portfolio</span>
              <strong>{project.portfolioId || "N/A"}</strong>
            </div> */}
          </article>

          <article className="details-card">
            <h2 className="h6">Schedule</h2>
            <div className="details-row">
              <span>Start Date</span>
              <strong>{formatDate(project.startDateUtc)}</strong>
            </div>
            <div className="details-row">
              <span>End Date</span>
              <strong>{formatDate(project.endDateUtc)}</strong>
            </div>
            <div className="details-row">
              <span>Created</span>
              <strong>{formatDate(project.createdDateUtc)}</strong>
            </div>
            <div className="details-row">
              <span>Updated</span>
              <strong>{formatDate(project.updatedDateUtc)}</strong>
            </div>
          </article>

          <article className="details-card full-width">
            <h2 className="h6">Objectives</h2>
            <p className="mb-0">
              {project.objectives || "No objectives provided."}
            </p>
          </article>

          <article className="details-card full-width">
            <h2 className="h6">Scope</h2>
            <p className="mb-0">{project.scope || "No scope provided."}</p>
          </article>

          <article className="details-card full-width documents-workspace-card">
            <div className="documents-workspace-head">
              <div className="documents-workspace-icon" aria-hidden="true">
                <i className="bi bi-folder2-open" />
              </div>
              <div>
                <h2 className="h6 mb-1">Documents Workspace</h2>
                <p className="documents-workspace-subtitle mb-0">
                  Centralize plans, specs, reports, and contracts with version
                  tracking.
                </p>
              </div>
            </div>

            <div className="documents-workspace-body">
              <div className="documents-workspace-feature">
                <i className="bi bi-check2-circle" />
                <span>Project-scoped document list</span>
              </div>
              <div className="documents-workspace-feature">
                <i className="bi bi-check2-circle" />
                <span>Create, update, and delete operations</span>
              </div>
              <div className="documents-workspace-feature">
                <i className="bi bi-check2-circle" />
                <span>Uploader and timestamp metadata</span>
              </div>
            </div>

            <div className="documents-workspace-actions">
              <button
                type="button"
                className="btn btn-info text-white"
                onClick={openDocumentsWorkspace}
              >
                <i className="bi bi-folder2-open me-2" />
                Open Documents Workspace
              </button>
            </div>
          </article>
        </section>
      )}

      {/* ── Team Members Section ── */}
      {activeTab === "team" && (
        <section className="members-section">
          <div className="members-section-header">
            <h2>
              <i className="bi bi-people-fill me-2" />
              Team Members
            </h2>
            <button
              type="button"
              className="btn btn-info text-white btn-sm"
              onClick={() => setShowAddMember((prev) => !prev)}
            >
              <i
                className={`bi ${showAddMember ? "bi-x-circle" : "bi-person-plus"} me-1`}
              />
              {showAddMember ? "Close" : "Add Member"}
            </button>
          </div>

          {showAddMember && (
            <div className="member-add-card">
              <h3 className="h6 mb-3">Add HR Employee to Project</h3>
              <input
                className="form-control form-control-sm mb-3"
                placeholder="Search employees by name or email..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
              />
              <div className="member-add-list">
                {filteredAvailableEmployees.length === 0 ? (
                  <div className="member-add-empty">
                    <i className="bi bi-people" />
                    <span>No available employees found.</span>
                  </div>
                ) : (
                  filteredAvailableEmployees.map((emp) => (
                    <div key={emp.id} className="member-add-item">
                      <div className="member-add-avatar">
                        {emp.firstName.charAt(0)}
                        {emp.lastName.charAt(0)}
                      </div>
                      <div className="member-add-info">
                        <span className="member-add-name">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="member-add-meta">
                          {emp.position?.title || "No position"} ·{" "}
                          {emp.department?.name || "No dept"}
                          {emp.email ? ` · ${emp.email}` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        disabled={addingMember}
                        onClick={() => handleAddMemberFromEmployee(emp)}
                      >
                        <i className="bi bi-plus-lg me-1" />
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {membersLoading ? (
            <div className="text-center py-4">
              <div
                className="spinner-border spinner-border-sm text-info"
                role="status"
              />
            </div>
          ) : projectMembers.length === 0 ? (
            <div className="members-empty">
              <i className="bi bi-person-x" />
              <p className="mb-0">
                No members yet. Click "Add Member" to add HR employees to this
                project.
              </p>
            </div>
          ) : (
            <div className="members-grid">
              {projectMembers.map((member) => {
                const emp = employees.find(
                  (e) => resolveEmployeeUserId(e) === member.userId,
                );
                const initials = member.fullName
                  .split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .slice(0, 2);
                return (
                  <div key={member.id} className="member-card">
                    <div className="member-card-header">
                      <div className="member-card-avatar">{initials}</div>
                      <div className="member-card-actions">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          title="Edit Role"
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setEditMemberRole(member.role);
                          }}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Remove Member"
                          onClick={() => handleDeleteMember(member)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                    <div className="member-card-body">
                      <h4 className="member-card-name">{member.fullName}</h4>
                      {editingMemberId === member.id ? (
                        <div className="member-card-edit-role">
                          <input
                            className="form-control form-control-sm"
                            value={editMemberRole}
                            onChange={(e) => setEditMemberRole(e.target.value)}
                            placeholder="Role"
                          />
                          <div className="member-card-edit-actions">
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateMemberRole(member)}
                            >
                              <i className="bi bi-check" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingMemberId(null)}
                            >
                              <i className="bi bi-x" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="member-card-role">{member.role}</span>
                      )}
                      {emp && (
                        <span className="member-card-dept">
                          {emp.department?.name || "No dept"}{" "}
                          {emp.email ? `· ${emp.email}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Tasks Section ── */}
      {activeTab === "tasks" && (
        <section className="tasks-section">
          <div className="tasks-section-header">
            <h2>
              <i className="bi bi-check2-square me-2" />
              Tasks
            </h2>
            <button
              type="button"
              className="btn btn-info text-white btn-sm"
              onClick={() => setShowCreateTask((prev) => !prev)}
            >
              <i
                className={`bi ${showCreateTask ? "bi-x-circle" : "bi-plus-lg"} me-1`}
              />
              {showCreateTask ? "Cancel" : "New Task"}
            </button>
          </div>

          {showCreateTask && (
            <div className="task-create-card">
              <h3 className="h6 mb-3">Create Task</h3>
              <form className="row g-3" onSubmit={handleCreateTask}>
                <div className="col-12 col-lg-6">
                  <label className="form-label">Title *</label>
                  <input
                    className="form-control"
                    name="title"
                    value={newTask.title}
                    onChange={handleNewTaskChange}
                    maxLength={180}
                    required
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    name="priority"
                    value={newTask.priority}
                    onChange={handleNewTaskChange}
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
                    value={newTask.status}
                    onChange={handleNewTaskChange}
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
                    value={newTask.startDateUtc}
                    onChange={handleNewTaskChange}
                  />
                </div>
                <div className="col-12 col-lg-4">
                  <label className="form-label">Due Date</label>
                  <input
                    className="form-control"
                    type="date"
                    name="dueDateUtc"
                    value={newTask.dueDateUtc}
                    onChange={handleNewTaskChange}
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
                    value={newTask.completionPercentage}
                    onChange={handleNewTaskChange}
                  />
                </div>
                <div className="col-12 col-lg-6">
                  <label className="form-label">Effort (Hours)</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.5"
                    name="effortEstimateHours"
                    value={newTask.effortEstimateHours}
                    onChange={handleNewTaskChange}
                  />
                </div>
                <div className="col-12 col-lg-6">
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
                      {newTask.assignedToMemberId ? (
                        <span className="employee-selected-name">
                          <i className="bi bi-person-fill me-1" />
                          {getMemberDisplayName(newTask.assignedToMemberId) ||
                            newTask.assignedToMemberId}
                          <button
                            type="button"
                            className="employee-clear-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewTask((prev) => ({
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
                            filteredMembers.map((m) => {
                              const emp = employees.find(
                                (e) => resolveEmployeeUserId(e) === m.userId,
                              );
                              return (
                                <div
                                  key={m.id}
                                  className={`employee-option ${newTask.assignedToMemberId === m.id ? "selected" : ""}`}
                                  onClick={() => {
                                    setNewTask((prev) => ({
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
                                      {m.role}{" "}
                                      {emp?.department?.name
                                        ? `· ${emp.department.name}`
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    name="description"
                    value={newTask.description}
                    onChange={handleNewTaskChange}
                    maxLength={2000}
                  />
                </div>
                <div className="col-12 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={creatingTask}
                  >
                    {creatingTask ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tasksLoading ? (
            <div className="text-center py-4">
              <div
                className="spinner-border spinner-border-sm text-info"
                role="status"
              />
            </div>
          ) : tasks.length === 0 ? (
            <div className="tasks-table-wrap">
              <div className="tasks-empty-message">
                <i className="bi bi-inbox" />
                No tasks yet. Click "New Task" to add one.
              </div>
            </div>
          ) : (
            <div className="tasks-table-wrap">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Progress</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() =>
                        navigate(
                          `/portfolios/${portfolioId}/projects/${projectId}/tasks/${t.id}`,
                        )
                      }
                    >
                      <td>{t.title || "Untitled"}</td>
                      <td>
                        <span
                          className="task-row-badge"
                          style={{
                            background:
                              priorityColor[t.priority ?? 1] || "#6c757d",
                          }}
                        >
                          {PriorityLevel[t.priority ?? 1] || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="task-row-badge"
                          style={{
                            background: statusColor[t.status ?? 0] || "#6c757d",
                          }}
                        >
                          {TaskStatusEnum[t.status ?? 0] || "N/A"}
                        </span>
                      </td>
                      <td>
                        {t.dueDateUtc
                          ? new Date(t.dueDateUtc).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>{t.completionPercentage ?? 0}%</td>
                      <td>
                        <div
                          className="task-row-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {confirmDeleteTaskId === t.id ? (
                            <span className="confirm-inline confirm-inline-sm">
                              <span className="confirm-inline-text">
                                Delete?
                              </span>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteTask(t.id)}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setConfirmDeleteTaskId(null)}
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => setConfirmDeleteTaskId(t.id)}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Phases Section ── */}
      {activeTab === "phases" && (
        <section className="tasks-section">
          <div className="tasks-section-header">
            <h2>
              <i className="bi bi-layers me-2" />
              Phases
            </h2>
            <button
              type="button"
              className="btn btn-info text-white btn-sm"
              onClick={() => setShowCreatePhase((prev) => !prev)}
            >
              <i
                className={`bi ${showCreatePhase ? "bi-x-circle" : "bi-plus-lg"} me-1`}
              />
              {showCreatePhase ? "Cancel" : "New Phase"}
            </button>
          </div>

          {showCreatePhase && (
            <div className="task-create-card">
              <h3 className="h6 mb-3">Create Phase</h3>
              <form className="row g-3" onSubmit={handleCreatePhase}>
                <div className="col-12 col-lg-6">
                  <label className="form-label">Name *</label>
                  <input
                    className="form-control"
                    name="name"
                    value={newPhase.name}
                    onChange={handleNewPhaseChange}
                    maxLength={120}
                    required
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <label className="form-label">Start Date</label>
                  <input
                    className="form-control"
                    type="date"
                    name="startDateUtc"
                    value={newPhase.startDateUtc}
                    onChange={handleNewPhaseChange}
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <label className="form-label">End Date</label>
                  <input
                    className="form-control"
                    type="date"
                    name="endDateUtc"
                    value={newPhase.endDateUtc}
                    onChange={handleNewPhaseChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Deliverables</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    name="deliverables"
                    value={newPhase.deliverables}
                    onChange={handleNewPhaseChange}
                    maxLength={1000}
                  />
                </div>
                <div className="col-12 d-flex align-items-center gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="newPhaseGate"
                      name="isGatePassed"
                      checked={newPhase.isGatePassed}
                      onChange={handleNewPhaseChange}
                    />
                    <label className="form-check-label" htmlFor="newPhaseGate">
                      Gate Passed
                    </label>
                  </div>
                  <div className="ms-auto">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={creatingPhase}
                    >
                      {creatingPhase ? "Creating..." : "Create Phase"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {phasesLoading ? (
            <div className="text-center py-4">
              <div
                className="spinner-border spinner-border-sm text-info"
                role="status"
              />
            </div>
          ) : phases.length === 0 ? (
            <div className="tasks-table-wrap">
              <div className="tasks-empty-message">
                <i className="bi bi-inbox" />
                No phases yet. Click "New Phase" to add one.
              </div>
            </div>
          ) : (
            <div className="tasks-table-wrap">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Gate</th>
                    <th>Deliverables</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((p) =>
                    editingPhaseId === p.id ? (
                      <tr key={p.id} className="phase-edit-row">
                        <td>
                          <input
                            className="form-control form-control-sm"
                            name="name"
                            value={editPhaseForm.name}
                            onChange={handleEditPhaseChange}
                            maxLength={120}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="date"
                            name="startDateUtc"
                            value={editPhaseForm.startDateUtc}
                            onChange={handleEditPhaseChange}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="date"
                            name="endDateUtc"
                            value={editPhaseForm.endDateUtc}
                            onChange={handleEditPhaseChange}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            name="isGatePassed"
                            checked={editPhaseForm.isGatePassed}
                            onChange={handleEditPhaseChange}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            name="deliverables"
                            value={editPhaseForm.deliverables}
                            onChange={handleEditPhaseChange}
                            maxLength={1000}
                          />
                        </td>
                        <td>
                          <div className="task-row-actions">
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdatePhase(p)}
                              title="Save"
                            >
                              <i className="bi bi-check-lg" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setEditingPhaseId(null)}
                              title="Cancel"
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={p.id}>
                        <td>{p.name || "Unnamed"}</td>
                        <td>
                          {p.startDateUtc
                            ? new Date(p.startDateUtc).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          {p.endDateUtc
                            ? new Date(p.endDateUtc).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <span
                            className="task-row-badge"
                            style={{
                              background: p.isGatePassed
                                ? "#28a745"
                                : "#6c757d",
                            }}
                          >
                            {p.isGatePassed ? "Passed" : "Pending"}
                          </span>
                        </td>
                        <td className="phase-deliverables-cell">
                          {p.deliverables || "—"}
                        </td>
                        <td>
                          <div className="task-row-actions">
                            {confirmDeletePhaseId === p.id ? (
                              <span className="confirm-inline confirm-inline-sm">
                                <span className="confirm-inline-text">
                                  Delete?
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeletePhase(p.id)}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => setConfirmDeletePhaseId(null)}
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => startEditPhase(p)}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => setConfirmDeletePhaseId(p.id)}
                                  title="Delete"
                                >
                                  <i className="bi bi-trash" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Resources Section ── */}
      {activeTab === "resources" && (
        <section className="tasks-section">
          <div className="tasks-section-header">
            <h2>
              <i className="bi bi-box-seam me-2" />
              Resources
            </h2>
            <button
              type="button"
              className="btn btn-info text-white btn-sm"
              onClick={() => setShowCreateResourceReq((prev) => !prev)}
            >
              <i
                className={`bi ${showCreateResourceReq ? "bi-x-circle" : "bi-plus-lg"} me-1`}
              />
              {showCreateResourceReq ? "Cancel" : "Request Resource"}
            </button>
          </div>

          {showCreateResourceReq && (
            <div className="task-create-card">
              <h3 className="h6 mb-3">Request a Resource</h3>
              <form className="row g-3" onSubmit={handleCreateResourceReq}>
                <div className="col-12 col-md-4">
                  <label className="form-label">Resource</label>
                  <select
                    className="form-select"
                    name="resourceId"
                    value={newResourceReq.resourceId}
                    onChange={handleNewResourceReqChange}
                  >
                    <option value="">— None —</option>
                    {allResources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name || r.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Resource Type</label>
                  <select
                    className="form-select"
                    name="resourceType"
                    value={newResourceReq.resourceType}
                    onChange={handleNewResourceReqChange}
                    disabled={!!newResourceReq.resourceId}
                  >
                    {Object.entries(ResourceType).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Allocation %</label>
                  <input
                    className="form-control"
                    type="number"
                    name="requestedAllocationPercentage"
                    value={newResourceReq.requestedAllocationPercentage}
                    onChange={handleNewResourceReqChange}
                    min={0}
                    max={100}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Comments</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    name="comments"
                    value={newResourceReq.comments}
                    onChange={handleNewResourceReqChange}
                    maxLength={500}
                  />
                </div>
                <div className="col-12 text-end">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={creatingResourceReq}
                  >
                    {creatingResourceReq ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {resourceRequestsLoading ? (
            <div className="text-center py-4">
              <div
                className="spinner-border spinner-border-sm text-info"
                role="status"
              />
            </div>
          ) : resourceRequests.length === 0 ? (
            <div className="tasks-table-wrap">
              <div className="tasks-empty-message">
                <i className="bi bi-inbox" />
                No resource requests yet. Click "Request Resource" to add one.
              </div>
            </div>
          ) : (
            <div className="tasks-table-wrap">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Allocation</th>
                    <th>Status</th>
                    <th>Comments</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceRequests.map((req) => (
                    <tr key={req.id}>
                      <td>{getResourceName(req.resourceId)}</td>
                      <td>
                        <span
                          className="task-row-badge"
                          style={{
                            background:
                              resourceTypeColor[req.resourceType ?? 0],
                          }}
                        >
                          {ResourceType[req.resourceType ?? 0] || "Unknown"}
                        </span>
                      </td>
                      <td>{req.requestedAllocationPercentage ?? 0}%</td>
                      <td>
                        <span
                          className="task-row-badge"
                          style={{
                            background: requestStatusColor[req.status ?? 0],
                          }}
                        >
                          {RequestStatus[req.status ?? 0] || "Unknown"}
                        </span>
                      </td>
                      <td className="phase-deliverables-cell">
                        {req.comments || "—"}
                      </td>
                      <td>
                        <div className="task-row-actions">
                          {confirmDeleteReqId === req.id ? (
                            <span className="confirm-inline confirm-inline-sm">
                              <span className="confirm-inline-text">
                                Delete?
                              </span>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteResourceReq(req.id)}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setConfirmDeleteReqId(null)}
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => setConfirmDeleteReqId(req.id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Finance Section ── */}
      {activeTab === "finance" && (
        <section className="tasks-section">
          <div className="tasks-section-header">
            <h2>
              <i className="bi bi-cash-coin me-2" />
              Finance
            </h2>
            <button
              type="button"
              className="btn btn-info text-white btn-sm"
              onClick={() => setShowCreateBudget((prev) => !prev)}
              disabled={availableBudgetCategoryEntries.length === 0}
            >
              <i
                className={`bi ${showCreateBudget ? "bi-x-circle" : "bi-plus-lg"} me-1`}
              />
              {showCreateBudget ? "Cancel" : "New Budget"}
            </button>
          </div>

          {showCreateBudget && (
            <div className="task-create-card">
              <h3 className="h6 mb-3">Create Budget</h3>
              {availableBudgetCategoryEntries.length === 0 ? (
                <div className="tasks-empty-message py-3">
                  All budget categories are already used in this project.
                </div>
              ) : (
                <form className="row g-3" onSubmit={handleCreateBudget}>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      name="category"
                      value={newBudget.category}
                      onChange={handleNewBudgetChange}
                      required
                    >
                      {availableBudgetCategoryEntries.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Planned Amount</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      name="plannedAmount"
                      value={newBudget.plannedAmount}
                      onChange={handleNewBudgetChange}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Actual Amount</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      name="actualAmount"
                      value={newBudget.actualAmount}
                      onChange={handleNewBudgetChange}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Forecast Amount</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      name="forecastAmount"
                      value={newBudget.forecastAmount}
                      onChange={handleNewBudgetChange}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={creatingBudget}
                    >
                      {creatingBudget ? "Creating..." : "Create Budget"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {budgetsLoading ? (
            <div className="text-center py-4">
              <div
                className="spinner-border spinner-border-sm text-info"
                role="status"
              />
            </div>
          ) : budgets.length === 0 ? (
            <div className="tasks-table-wrap">
              <div className="tasks-empty-message">
                <i className="bi bi-inbox" />
                No budgets yet. Click "New Budget" to add one.
              </div>
            </div>
          ) : (
            <>
              <div className="finance-charts-grid mb-3">
                <article className="details-card finance-chart-card">
                  <div className="finance-chart-header">
                    <h3 className="h6 mb-1">Budget vs Actual vs Forecast</h3>
                    <p className="mb-0">
                      Compare planned budget, current spending, and projected
                      final cost.
                    </p>
                  </div>
                  <div className="finance-chart-body">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={budgetChartData}
                        margin={{ top: 12, right: 12, left: 4, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6eef5" />
                        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) =>
                            currencyFormatter.format(Number(value ?? 0))
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="planned"
                          name="Planned"
                          fill="#1b4965"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="actual"
                          name="Actual"
                          fill="#ef8354"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="forecast"
                          name="Forecast"
                          fill="#189ab4"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="details-card finance-chart-card">
                  <div className="finance-chart-header">
                    <h3 className="h6 mb-1">Planned Budget Distribution</h3>
                    <p className="mb-0">
                      Allocation of planned budget across categories.
                    </p>
                  </div>
                  <div className="finance-chart-body">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={budgetDistributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={105}
                        >
                          {budgetDistributionData.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={chartPalette[index % chartPalette.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            currencyFormatter.format(Number(value ?? 0))
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </div>

              <article className="details-card finance-consumption-card mb-3">
                <h3 className="h6 mb-3">Budget Consumption by Category</h3>
                <div className="finance-consumption-list">
                  {budgetConsumptionData.map((item) => {
                    const boundedPercent = Math.max(
                      0,
                      Math.min(item.percent, 100),
                    );
                    const overBudget = item.percent > 100;

                    return (
                      <div key={item.id} className="finance-consumption-item">
                        <div className="finance-consumption-top">
                          <span className="finance-consumption-name">
                            {item.category}
                          </span>
                          <span
                            className={`finance-consumption-percent ${overBudget ? "over" : ""}`}
                          >
                            {item.percent.toFixed(1)}%
                          </span>
                        </div>
                        <div
                          className="finance-consumption-track"
                          role="progressbar"
                        >
                          <span
                            className={`finance-consumption-fill ${overBudget ? "over" : ""}`}
                            style={{ width: `${boundedPercent}%` }}
                          />
                        </div>
                        <p className="finance-consumption-meta mb-0">
                          {currencyFormatter.format(item.actual)} of{" "}
                          {currencyFormatter.format(item.planned)} consumed
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>

              <div className="tasks-table-wrap">
                <table className="tasks-table budget-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Planned</th>
                      <th>Actual</th>
                      <th>Forecast</th>
                      <th style={{ width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((b) =>
                      editingBudgetId === b.id ? (
                        <tr key={b.id} className="phase-edit-row">
                          <td>
                            <select
                              className="form-select form-select-sm"
                              name="category"
                              value={editBudgetForm.category}
                              onChange={handleEditBudgetChange}
                            >
                              {Object.entries(BudgetCategory).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              name="plannedAmount"
                              value={editBudgetForm.plannedAmount}
                              onChange={handleEditBudgetChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              name="actualAmount"
                              value={editBudgetForm.actualAmount}
                              onChange={handleEditBudgetChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              name="forecastAmount"
                              value={editBudgetForm.forecastAmount}
                              onChange={handleEditBudgetChange}
                            />
                          </td>
                          <td>
                            <div className="task-row-actions">
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => handleUpdateBudget(b)}
                                title="Save"
                              >
                                <i className="bi bi-check-lg" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setEditingBudgetId(null)}
                                title="Cancel"
                              >
                                <i className="bi bi-x-lg" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={b.id}>
                          <td>
                            {BudgetCategory[b.category ?? 0] || "Unknown"}
                          </td>
                          <td>${(b.plannedAmount ?? 0).toLocaleString()}</td>
                          <td>${(b.actualAmount ?? 0).toLocaleString()}</td>
                          <td>${(b.forecastAmount ?? 0).toLocaleString()}</td>
                          <td>
                            <div className="task-row-actions">
                              {confirmDeleteBudgetId === b.id ? (
                                <span className="confirm-inline confirm-inline-sm">
                                  <span className="confirm-inline-text">
                                    Delete?
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteBudget(b.id)}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() =>
                                      setConfirmDeleteBudgetId(null)
                                    }
                                  >
                                    No
                                  </button>
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => startEditBudget(b)}
                                    title="Edit"
                                  >
                                    <i className="bi bi-pencil" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() =>
                                      setConfirmDeleteBudgetId(b.id)
                                    }
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default ProjectDetails;
