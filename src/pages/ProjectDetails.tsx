import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
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
import milestoneService, { type Milestone } from "../services/milestoneService";
import milestoneApprovalService, {
  type MilestoneApproval,
} from "../services/milestoneApprovalService";
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
import riskService, {
  type Risk,
  type RiskEvent,
} from "../services/riskService";
import {
  ProjectStage,
  HealthStatus,
  MethodologyType,
  PriorityLevel,
  TaskStatus as TaskStatusEnum,
  BudgetCategory,
  ResourceType,
  RequestStatus,
  ApprovalStatus,
  RiskImpact,
  RiskProbability,
  RiskEventStatus,
} from "../config/enums";
import type { RootState } from "../store/store";
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

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toDateTimeLocalInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function safeInt(value: string | undefined, fallback = 0): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function getTaskStatusColor(status: number): string {
  const statusColors: Record<number, string> = {
    0: "#6c757d",
    1: "#17a2b8",
    2: "#007bff",
    3: "#dc3545",
    4: "#f59e0b",
    5: "#28a745",
    6: "#adb5bd",
  };

  return statusColors[status] || "#6b7280";
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
  | "phases"
  | "risks"
  | "resources"
  | "finance";

export function ProjectDetails() {
  const navigate = useNavigate();
  const { portfolioId, projectId } = useParams();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] =
    useState<EditProjectFormState>(initialEditForm);
  const [activeTab, setActiveTab] = useState<ProjectDetailsTab>("overview");

  // ── Task state ──
  const [tasks, setTasks] = useState<Task[]>([]);
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
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
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

  // ── Milestone state ──
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null,
  );
  const [showCreateMilestone, setShowCreateMilestone] = useState(false);
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: "",
    targetDateUtc: "",
    successCriteria: "",
    isCompleted: false,
  });
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null,
  );
  const [editMilestoneForm, setEditMilestoneForm] = useState({
    name: "",
    targetDateUtc: "",
    actualDateUtc: "",
    successCriteria: "",
    isCompleted: false,
  });
  const [confirmDeleteMilestoneId, setConfirmDeleteMilestoneId] = useState<
    string | null
  >(null);
  const [milestoneApprovals, setMilestoneApprovals] = useState<
    MilestoneApproval[]
  >([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [showCreateApproval, setShowCreateApproval] = useState(false);
  const [creatingApproval, setCreatingApproval] = useState(false);
  const [newApprovalForm, setNewApprovalForm] = useState({
    status: "2",
    comments: "",
    decidedAtUtc: "",
  });
  const [editingApprovalId, setEditingApprovalId] = useState<string | null>(
    null,
  );
  const [editApprovalForm, setEditApprovalForm] = useState({
    status: "2",
    comments: "",
    decidedAtUtc: "",
  });
  const [confirmDeleteApprovalId, setConfirmDeleteApprovalId] = useState<
    string | null
  >(null);
  const [phaseVisualLoading, setPhaseVisualLoading] = useState(false);
  const [phaseMilestoneTasks, setPhaseMilestoneTasks] = useState<
    Record<string, Task[]>
  >({});
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

  const currentUserId = useMemo(() => {
    if (authUser?.id?.trim()) {
      return authUser.id.trim();
    }

    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        return "";
      }

      const parsed = JSON.parse(raw) as { id?: string };
      return typeof parsed.id === "string" ? parsed.id.trim() : "";
    } catch {
      return "";
    }
  }, [authUser?.id]);

  function getApproverDisplayName(approverId?: string | null) {
    if (!approverId) {
      return "Unknown";
    }

    if (currentUserId && approverId === currentUserId) {
      return "You";
    }

    const byUserId = projectMembers.find(
      (member) => member.userId === approverId,
    );
    if (byUserId?.fullName) {
      return byUserId.fullName;
    }

    const byMemberId = projectMembers.find(
      (member) => member.id === approverId,
    );
    if (byMemberId?.fullName) {
      return byMemberId.fullName;
    }

    return approverId;
  }

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

  // ── Risks state ──
  const [risks, setRisks] = useState<Risk[]>([]);
  const [risksLoading, setRisksLoading] = useState(false);
  const [risksLoaded, setRisksLoaded] = useState(false);
  const [showCreateRisk, setShowCreateRisk] = useState(false);
  const [creatingRisk, setCreatingRisk] = useState(false);
  const [newRisk, setNewRisk] = useState({
    description: "",
    probability: "2",
    impact: "1",
    mitigationPlan: "",
    ownerId: "",
  });
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [editRiskForm, setEditRiskForm] = useState({
    description: "",
    probability: "2",
    impact: "1",
    mitigationPlan: "",
    ownerId: "",
  });
  const [confirmDeleteRiskId, setConfirmDeleteRiskId] = useState<string | null>(
    null,
  );

  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);
  const [riskEventsByRisk, setRiskEventsByRisk] = useState<
    Record<string, RiskEvent[]>
  >({});
  const [riskEventsLoadingByRisk, setRiskEventsLoadingByRisk] = useState<
    Record<string, boolean>
  >({});
  const [showCreateEventForRiskId, setShowCreateEventForRiskId] = useState<
    string | null
  >(null);
  const [creatingRiskEvent, setCreatingRiskEvent] = useState(false);
  const [newRiskEvent, setNewRiskEvent] = useState({
    incidentDescription: "",
    status: "0",
    occurredAtUtc: "",
  });
  const [editingRiskEventId, setEditingRiskEventId] = useState<string | null>(
    null,
  );
  const [editRiskEventForm, setEditRiskEventForm] = useState({
    incidentDescription: "",
    status: "0",
    occurredAtUtc: "",
  });
  const [confirmDeleteRiskEventId, setConfirmDeleteRiskEventId] = useState<
    string | null
  >(null);
  const [riskSeverityFilter, setRiskSeverityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [riskSortBy, setRiskSortBy] = useState<
    "recent" | "impact" | "probability" | "severity"
  >("severity");

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
    setPhasesLoaded(false);
    setSelectedPhaseId(null);
    setMilestones([]);
    setSelectedMilestoneId(null);
    setMilestoneApprovals([]);
    setShowCreateApproval(false);
    setEditingApprovalId(null);
    setConfirmDeleteApprovalId(null);
    setTasks([]);
    setShowCreateTask(false);
    setShowCreateMilestone(false);
    setMembersLoaded(false);
    setEmployeesLoaded(false);
    setResourceRequestsLoaded(false);
    setBudgetsLoaded(false);
    setRisksLoaded(false);
    setRisks([]);
    setExpandedRiskId(null);
    setRiskEventsByRisk({});
    setShowCreateRisk(false);
    setShowCreateEventForRiskId(null);
    setActiveTab("overview");
  }, [projectId]);

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

  // ── Fetch milestones for selected phase ──
  useEffect(() => {
    async function fetchMilestones() {
      if (!projectId || activeTab !== "phases") return;

      if (!selectedPhaseId) {
        setMilestones([]);
        return;
      }

      try {
        setMilestonesLoading(true);
        const data = await milestoneService.getMilestones({
          projectId,
          projectPhaseId: selectedPhaseId ?? undefined,
        });
        setMilestones(data);
      } catch (error) {
        console.error(error);
      } finally {
        setMilestonesLoading(false);
      }
    }

    fetchMilestones();
  }, [projectId, activeTab, selectedPhaseId]);

  // ── Fetch tasks for selected milestone ──
  useEffect(() => {
    async function fetchTasks() {
      if (!projectId || activeTab !== "phases") return;

      if (!selectedMilestoneId) {
        setTasks([]);
        return;
      }

      try {
        setTasksLoading(true);
        const data = await taskService.getTasks({
          projectId,
          milestoneId: selectedMilestoneId,
        });
        setTasks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setTasksLoading(false);
      }
    }

    fetchTasks();
  }, [projectId, activeTab, selectedMilestoneId]);

  // ── Fetch approvals for selected milestone ──
  useEffect(() => {
    async function fetchMilestoneApprovals() {
      if (!activeTab || activeTab !== "phases") {
        return;
      }

      if (!selectedMilestoneId) {
        setMilestoneApprovals([]);
        setShowCreateApproval(false);
        setEditingApprovalId(null);
        return;
      }

      try {
        setApprovalsLoading(true);
        const data =
          await milestoneApprovalService.getApprovalsByMilestoneId(
            selectedMilestoneId,
          );
        setMilestoneApprovals(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load milestone approvals.");
      } finally {
        setApprovalsLoading(false);
      }
    }

    fetchMilestoneApprovals();
  }, [activeTab, selectedMilestoneId]);

  // ── Fetch tasks for all milestones in selected phase (visual summary) ──
  useEffect(() => {
    async function fetchPhaseVisualTasks() {
      if (!projectId || activeTab !== "phases" || !selectedPhaseId) {
        setPhaseMilestoneTasks({});
        setPhaseVisualLoading(false);
        return;
      }

      if (milestones.length === 0) {
        setPhaseMilestoneTasks({});
        setPhaseVisualLoading(false);
        return;
      }

      try {
        setPhaseVisualLoading(true);
        const entries = await Promise.all(
          milestones.map(async (milestone) => {
            const milestoneTasks = await taskService.getTasks({
              projectId,
              milestoneId: milestone.id,
            });
            return [milestone.id, milestoneTasks] as const;
          }),
        );

        setPhaseMilestoneTasks(Object.fromEntries(entries));
      } catch (error) {
        console.error(error);
      } finally {
        setPhaseVisualLoading(false);
      }
    }

    fetchPhaseVisualTasks();
  }, [projectId, activeTab, selectedPhaseId, milestones]);

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

  // ── Fetch risks ──
  useEffect(() => {
    async function fetchRisks() {
      if (!projectId || activeTab !== "risks" || risksLoaded) return;

      try {
        setRisksLoading(true);
        const data = await riskService.getRisks(projectId);
        setRisks(data);
        setRisksLoaded(true);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load risks.");
      } finally {
        setRisksLoading(false);
      }
    }

    fetchRisks();
  }, [projectId, activeTab, risksLoaded]);

  async function refreshRisks() {
    if (!projectId) return;
    try {
      setRisksLoading(true);
      const data = await riskService.getRisks(projectId);
      setRisks(data);
      setRisksLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to refresh risks.");
    } finally {
      setRisksLoading(false);
    }
  }

  function getRiskSeverityBucket(risk: Risk): "high" | "medium" | "low" {
    const impact = risk.impact ?? 0;
    const probability = risk.probability ?? 0;
    const score = impact + probability;

    if (impact >= 2 || probability >= 3 || score >= 5) {
      return "high";
    }

    if (impact >= 1 || probability >= 2 || score >= 3) {
      return "medium";
    }

    return "low";
  }

  function getRiskSeverityLabel(risk: Risk): string {
    const bucket = getRiskSeverityBucket(risk);
    return bucket.charAt(0).toUpperCase() + bucket.slice(1);
  }

  function getRiskSeverityColor(bucket: "high" | "medium" | "low"): string {
    if (bucket === "high") return "#dc2626";
    if (bucket === "medium") return "#f59e0b";
    return "#16a34a";
  }

  async function loadRiskEvents(riskId: string, force = false) {
    if (!force && riskEventsByRisk[riskId]) return;

    try {
      setRiskEventsLoadingByRisk((prev) => ({ ...prev, [riskId]: true }));
      const data = await riskService.getRiskEvents(riskId);
      setRiskEventsByRisk((prev) => ({ ...prev, [riskId]: data }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load risk events.");
    } finally {
      setRiskEventsLoadingByRisk((prev) => ({ ...prev, [riskId]: false }));
    }
  }

  async function handleToggleRiskExpansion(riskId: string) {
    if (expandedRiskId === riskId) {
      setExpandedRiskId(null);
      setShowCreateEventForRiskId(null);
      setEditingRiskEventId(null);
      setConfirmDeleteRiskEventId(null);
      return;
    }

    setExpandedRiskId(riskId);
    setShowCreateEventForRiskId(null);
    setEditingRiskEventId(null);
    setConfirmDeleteRiskEventId(null);
    await loadRiskEvents(riskId);
  }

  function handleNewRiskChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setNewRisk((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditRiskChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setEditRiskForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;

    if (!newRisk.description.trim()) {
      toast.error("Risk description is required.");
      return;
    }

    try {
      setCreatingRisk(true);
      await riskService.createRisk({
        projectId,
        description: newRisk.description.trim(),
        probability: safeInt(newRisk.probability),
        impact: safeInt(newRisk.impact),
        mitigationPlan: newRisk.mitigationPlan.trim() || undefined,
        ownerId: newRisk.ownerId.trim() || undefined,
      });

      toast.success("Risk created successfully.");
      setNewRisk({
        description: "",
        probability: "2",
        impact: "1",
        mitigationPlan: "",
        ownerId: "",
      });
      setShowCreateRisk(false);
      await refreshRisks();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create risk.");
    } finally {
      setCreatingRisk(false);
    }
  }

  function startEditRisk(risk: Risk) {
    setEditingRiskId(risk.id);
    setEditRiskForm({
      description: risk.description || "",
      probability: String(risk.probability ?? 2),
      impact: String(risk.impact ?? 1),
      mitigationPlan: risk.mitigationPlan || "",
      ownerId: risk.ownerId || "",
    });
  }

  async function handleUpdateRisk(risk: Risk) {
    if (!projectId) return;

    if (!editRiskForm.description.trim()) {
      toast.error("Risk description is required.");
      return;
    }

    try {
      const latest = await riskService.getRiskById(risk.id);
      await riskService.updateRiskById(risk.id, {
        id: risk.id,
        projectId,
        rowVersion: latest.rowVersion || risk.rowVersion || "",
        description: editRiskForm.description.trim(),
        probability: safeInt(editRiskForm.probability),
        impact: safeInt(editRiskForm.impact),
        mitigationPlan: editRiskForm.mitigationPlan.trim() || undefined,
        ownerId: editRiskForm.ownerId.trim() || undefined,
      });

      toast.success("Risk updated.");
      setEditingRiskId(null);
      await refreshRisks();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update risk.");
    }
  }

  async function handleDeleteRisk(riskId: string) {
    try {
      await riskService.deleteRiskById(riskId);
      toast.success("Risk deleted.");
      setRisks((prev) => prev.filter((risk) => risk.id !== riskId));
      setRiskEventsByRisk((prev) => {
        const next = { ...prev };
        delete next[riskId];
        return next;
      });
      if (expandedRiskId === riskId) {
        setExpandedRiskId(null);
        setShowCreateEventForRiskId(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete risk.");
    } finally {
      setConfirmDeleteRiskId(null);
    }
  }

  function handleNewRiskEventChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setNewRiskEvent((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditRiskEventChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setEditRiskEventForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateRiskEvent(
    event: FormEvent<HTMLFormElement>,
    riskId: string,
  ) {
    event.preventDefault();

    if (!newRiskEvent.incidentDescription.trim()) {
      toast.error("Event incident description is required.");
      return;
    }

    try {
      setCreatingRiskEvent(true);
      await riskService.createRiskEvent({
        projectRiskId: riskId,
        incidentDescription: newRiskEvent.incidentDescription.trim(),
        status: safeInt(newRiskEvent.status),
        occurredAtUtc: newRiskEvent.occurredAtUtc
          ? new Date(newRiskEvent.occurredAtUtc).toISOString()
          : undefined,
      });

      toast.success("Risk event created.");
      setNewRiskEvent({
        incidentDescription: "",
        status: "0",
        occurredAtUtc: "",
      });
      setShowCreateEventForRiskId(null);
      await loadRiskEvents(riskId, true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create risk event.");
    } finally {
      setCreatingRiskEvent(false);
    }
  }

  function startEditRiskEvent(eventItem: RiskEvent) {
    setEditingRiskEventId(eventItem.id);
    setEditRiskEventForm({
      incidentDescription: eventItem.incidentDescription || "",
      status: String(eventItem.status ?? 0),
      occurredAtUtc: toDateInputValue(eventItem.occurredAtUtc),
    });
  }

  async function handleUpdateRiskEvent(eventItem: RiskEvent) {
    const riskId = eventItem.projectRiskId;
    if (!riskId) return;

    if (!editRiskEventForm.incidentDescription.trim()) {
      toast.error("Event incident description is required.");
      return;
    }

    try {
      const latest = await riskService.getRiskEventById(eventItem.id);
      await riskService.updateRiskEventById(eventItem.id, {
        id: eventItem.id,
        projectRiskId: riskId,
        rowVersion: latest.rowVersion || eventItem.rowVersion || "",
        incidentDescription: editRiskEventForm.incidentDescription.trim(),
        status: safeInt(editRiskEventForm.status),
        occurredAtUtc: editRiskEventForm.occurredAtUtc
          ? new Date(editRiskEventForm.occurredAtUtc).toISOString()
          : undefined,
      });

      toast.success("Risk event updated.");
      setEditingRiskEventId(null);
      await loadRiskEvents(riskId, true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update risk event.");
    }
  }

  async function handleDeleteRiskEvent(eventId: string, riskId: string) {
    try {
      await riskService.deleteRiskEventById(eventId);
      toast.success("Risk event deleted.");
      await loadRiskEvents(riskId, true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete risk event.");
    } finally {
      setConfirmDeleteRiskEventId(null);
    }
  }

  // ── Fetch employees (for adding to project) ──
  useEffect(() => {
    async function fetchEmployees() {
      if ((activeTab !== "team" && activeTab !== "phases") || employeesLoaded) {
        return;
      }
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
    if ((activeTab === "team" || activeTab === "phases") && !membersLoaded) {
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

  function getTaskAssigneeInfo(task: Task): {
    label: string;
    type: "hr" | "member" | null;
  } {
    const withEmployerId = task as Task & { employerId?: string | null };
    const employerId = withEmployerId.employerId?.trim();

    if (employerId) {
      return {
        label: employeeLabelByEmployerId.get(employerId) || employerId,
        type: "hr",
      };
    }

    if (task.assignedToMemberId) {
      return {
        label:
          getMemberDisplayName(task.assignedToMemberId) ||
          task.assignedToMemberId,
        type: "member",
      };
    }

    return { label: "Unassigned", type: null };
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
      navigate("/dashboard/portfolios");
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
    if (!selectedMilestoneId) {
      toast.error("Select a milestone before creating a task.");
      return;
    }
    if (!newTask.title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    try {
      setCreatingTask(true);

      await taskService.createTask({
        projectId,
        milestoneId: selectedMilestoneId,
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
      const refreshed = await taskService.getTasks({
        projectId,
        milestoneId: selectedMilestoneId,
      });
      setTasks(refreshed);
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
      if (selectedPhaseId === phaseId) {
        setSelectedPhaseId(null);
        setSelectedMilestoneId(null);
        setMilestones([]);
        setTasks([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete phase.");
    } finally {
      setConfirmDeletePhaseId(null);
    }
  }

  function handleNewMilestoneChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      setNewMilestone((prev) => ({
        ...prev,
        [name]: (event.target as HTMLInputElement).checked,
      }));
      return;
    }

    setNewMilestone((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId || !selectedPhaseId) return;
    if (!newMilestone.name.trim()) {
      toast.error("Milestone name is required.");
      return;
    }

    try {
      setCreatingMilestone(true);
      await milestoneService.createMilestone({
        projectId,
        projectPhaseId: selectedPhaseId ?? undefined,
        name: newMilestone.name.trim(),
        targetDateUtc: newMilestone.targetDateUtc
          ? new Date(newMilestone.targetDateUtc).toISOString()
          : undefined,
        successCriteria: newMilestone.successCriteria.trim() || undefined,
        isCompleted: newMilestone.isCompleted,
      });

      toast.success("Milestone created successfully.");
      setNewMilestone({
        name: "",
        targetDateUtc: "",
        successCriteria: "",
        isCompleted: false,
      });
      setShowCreateMilestone(false);

      const refreshed = await milestoneService.getMilestones({
        projectId,
        projectPhaseId: selectedPhaseId ?? undefined,
      });
      setMilestones(refreshed);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create milestone.");
    } finally {
      setCreatingMilestone(false);
    }
  }

  function startEditMilestone(milestone: Milestone) {
    setEditingMilestoneId(milestone.id);
    setEditMilestoneForm({
      name: milestone.name || "",
      targetDateUtc: toDateInputValue(milestone.targetDateUtc),
      actualDateUtc: toDateInputValue(milestone.actualDateUtc),
      successCriteria: milestone.successCriteria || "",
      isCompleted: milestone.isCompleted ?? false,
    });
  }

  function handleEditMilestoneChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      setEditMilestoneForm((prev) => ({
        ...prev,
        [name]: (event.target as HTMLInputElement).checked,
      }));
      return;
    }

    setEditMilestoneForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateMilestone(milestone: Milestone) {
    if (!projectId || !editMilestoneForm.name.trim()) {
      toast.error("Milestone name is required.");
      return;
    }

    try {
      const full = await milestoneService.getMilestoneById(milestone.id);
      const resolvedProjectPhaseId =
        full.projectPhaseId ??
        milestone.projectPhaseId ??
        selectedPhaseId ??
        undefined;
      await milestoneService.updateMilestoneById(milestone.id, {
        id: full.id || milestone.id,
        projectId: full.projectId || projectId,
        projectPhaseId: resolvedProjectPhaseId,
        rowVersion: full.rowVersion || milestone.rowVersion || "",
        name: editMilestoneForm.name.trim(),
        targetDateUtc: editMilestoneForm.targetDateUtc
          ? new Date(editMilestoneForm.targetDateUtc).toISOString()
          : undefined,
        actualDateUtc: editMilestoneForm.actualDateUtc
          ? new Date(editMilestoneForm.actualDateUtc).toISOString()
          : undefined,
        successCriteria: editMilestoneForm.successCriteria.trim() || undefined,
        isCompleted: editMilestoneForm.isCompleted,
      });

      toast.success("Milestone updated.");
      setEditingMilestoneId(null);
      const refreshed = await milestoneService.getMilestones({
        projectId,
        projectPhaseId: selectedPhaseId ?? undefined,
      });
      setMilestones(refreshed);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update milestone.");
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    try {
      await milestoneService.deleteMilestoneById(milestoneId);
      toast.success("Milestone deleted.");
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      if (selectedMilestoneId === milestoneId) {
        setSelectedMilestoneId(null);
        setTasks([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete milestone.");
    } finally {
      setConfirmDeleteMilestoneId(null);
    }
  }

  function handleNewApprovalChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setNewApprovalForm((prev) => ({ ...prev, [name]: value }));
  }

  function startEditApproval(approval: MilestoneApproval) {
    setEditingApprovalId(approval.id);
    setEditApprovalForm({
      status: String(approval.status ?? 2),
      comments: approval.comments || "",
      decidedAtUtc: toDateTimeLocalInputValue(approval.decidedAtUtc),
    });
  }

  function handleEditApprovalChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setEditApprovalForm((prev) => ({ ...prev, [name]: value }));
  }

  async function refreshMilestoneApprovals() {
    if (!selectedMilestoneId) {
      setMilestoneApprovals([]);
      return;
    }

    const data =
      await milestoneApprovalService.getApprovalsByMilestoneId(
        selectedMilestoneId,
      );
    setMilestoneApprovals(data);
  }

  async function handleCreateApproval() {
    if (!selectedMilestoneId) {
      toast.error("Select a milestone first.");
      return;
    }

    if (!currentUserId) {
      toast.error("Unable to detect the logged-in user.");
      return;
    }

    try {
      setCreatingApproval(true);
      await milestoneApprovalService.createApproval({
        milestoneId: selectedMilestoneId,
        approverId: currentUserId,
        status: safeInt(newApprovalForm.status, 2),
        comments: newApprovalForm.comments.trim() || undefined,
        decidedAtUtc: newApprovalForm.decidedAtUtc
          ? new Date(newApprovalForm.decidedAtUtc).toISOString()
          : undefined,
      });

      toast.success("Approval added.");
      setShowCreateApproval(false);
      setNewApprovalForm({ status: "2", comments: "", decidedAtUtc: "" });
      await refreshMilestoneApprovals();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add approval.");
    } finally {
      setCreatingApproval(false);
    }
  }

  async function handleUpdateApproval(approval: MilestoneApproval) {
    if (!selectedMilestoneId) {
      toast.error("Select a milestone first.");
      return;
    }

    if (!currentUserId) {
      toast.error("Unable to detect the logged-in user.");
      return;
    }

    try {
      const full = await milestoneApprovalService.getApprovalById(approval.id);
      await milestoneApprovalService.updateApprovalById(approval.id, {
        id: full.id || approval.id,
        milestoneId: full.milestoneId || selectedMilestoneId,
        approverId: currentUserId,
        status: safeInt(editApprovalForm.status, 2),
        comments: editApprovalForm.comments.trim() || undefined,
        decidedAtUtc: editApprovalForm.decidedAtUtc
          ? new Date(editApprovalForm.decidedAtUtc).toISOString()
          : undefined,
        rowVersion: full.rowVersion || approval.rowVersion || "",
      });

      toast.success("Approval updated.");
      setEditingApprovalId(null);
      await refreshMilestoneApprovals();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update approval.");
    }
  }

  async function handleDeleteApproval(approvalId: string) {
    try {
      await milestoneApprovalService.deleteApprovalById(approvalId);
      toast.success("Approval deleted.");
      setMilestoneApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete approval.");
    } finally {
      setConfirmDeleteApprovalId(null);
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
      `/dashboard/portfolios/${resolvedPortfolioId}/projects/${project.id}/documents`,
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

  const selectedPhase =
    phases.find((phase) => phase.id === selectedPhaseId) || null;
  const selectedMilestone =
    milestones.find((milestone) => milestone.id === selectedMilestoneId) ||
    null;

  const phaseMilestoneVisualRows = useMemo(
    () =>
      milestones.map((milestone) => {
        const milestoneTasks = phaseMilestoneTasks[milestone.id] || [];
        const statusCounts = milestoneTasks.reduce(
          (acc, task) => {
            const status = typeof task.status === "number" ? task.status : 0;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        );
        const completedTasks = statusCounts[5] || 0;
        const completionPercent =
          milestoneTasks.length > 0
            ? Math.round((completedTasks / milestoneTasks.length) * 100)
            : 0;

        const milestoneStatus = milestone.isCompleted
          ? "Completed"
          : milestoneTasks.length > 0
            ? "Active"
            : "No Tasks";

        return {
          id: milestone.id,
          name: milestone.name || "Unnamed Milestone",
          milestoneStatus,
          completionPercent,
          totalTasks: milestoneTasks.length,
          completedTasks,
          statusCounts,
        };
      }),
    [milestones, phaseMilestoneTasks],
  );

  const phaseVisualSummary = useMemo(() => {
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(
      (milestone) => milestone.isCompleted,
    ).length;
    const milestoneProgressPercent =
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

    const taskTotals = phaseMilestoneVisualRows.reduce(
      (acc, row) => {
        acc.total += row.totalTasks;
        acc.completed += row.completedTasks;
        Object.entries(row.statusCounts).forEach(([status, count]) => {
          const statusKey = Number(status);
          acc.statusCounts[statusKey] =
            (acc.statusCounts[statusKey] || 0) + count;
        });
        return acc;
      },
      {
        total: 0,
        completed: 0,
        statusCounts: {} as Record<number, number>,
      },
    );

    const taskProgressPercent =
      taskTotals.total > 0
        ? Math.round((taskTotals.completed / taskTotals.total) * 100)
        : 0;

    return {
      totalMilestones,
      completedMilestones,
      milestoneProgressPercent,
      taskTotals,
      taskProgressPercent,
    };
  }, [milestones, phaseMilestoneVisualRows]);

  const riskSummaryData = useMemo(() => {
    const counts = {
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const risk of risks) {
      counts[getRiskSeverityBucket(risk)] += 1;
    }

    return [
      {
        name: "High",
        key: "high",
        value: counts.high,
        color: getRiskSeverityColor("high"),
      },
      {
        name: "Medium",
        key: "medium",
        value: counts.medium,
        color: getRiskSeverityColor("medium"),
      },
      {
        name: "Low",
        key: "low",
        value: counts.low,
        color: getRiskSeverityColor("low"),
      },
    ];
  }, [risks]);

  const riskEventsChartData = useMemo(
    () =>
      risks.map((risk) => ({
        id: risk.id,
        name:
          risk.description?.slice(0, 24) ||
          `Risk ${risk.id.slice(0, 8).toUpperCase()}`,
        events: (riskEventsByRisk[risk.id] || []).length,
      })),
    [risks, riskEventsByRisk],
  );

  const displayedRisks = useMemo(() => {
    const filtered = risks.filter((risk) => {
      if (riskSeverityFilter === "all") return true;
      return getRiskSeverityBucket(risk) === riskSeverityFilter;
    });

    return [...filtered].sort((a, b) => {
      if (riskSortBy === "impact") {
        return (b.impact ?? 0) - (a.impact ?? 0);
      }

      if (riskSortBy === "probability") {
        return (b.probability ?? 0) - (a.probability ?? 0);
      }

      if (riskSortBy === "severity") {
        const scoreA = (a.impact ?? 0) + (a.probability ?? 0);
        const scoreB = (b.impact ?? 0) + (b.probability ?? 0);
        return scoreB - scoreA;
      }

      const dateA = new Date(a.createdDateUtc || 0).getTime();
      const dateB = new Date(b.createdDateUtc || 0).getTime();
      return dateB - dateA;
    });
  }, [risks, riskSeverityFilter, riskSortBy]);

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
            onClick={() => navigate("/dashboard/portfolios")}
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
            onClick={() => navigate("/dashboard/portfolios")}
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
          className={`project-tab-btn ${activeTab === "phases" ? "active" : ""}`}
          onClick={() => setActiveTab("phases")}
        >
          <i className="bi bi-layers me-2" />
          Phases
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === "risks" ? "active" : ""}`}
          onClick={() => setActiveTab("risks")}
        >
          <i className="bi bi-shield-exclamation me-2" />
          Risks
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

      {/* ── Phases Section ── */}
      {activeTab === "phases" && (
        <section className="tasks-section">
          <div className="tasks-section-header">
            <h2>
              <i className="bi bi-diagram-3 me-2" />
              Execution Drill-Down
            </h2>
            <div className="drilldown-breadcrumb">
              <span>{selectedPhaseId ? "Phase selected" : "Phase"}</span>
              <i className="bi bi-chevron-right" />
              <span>
                {selectedMilestoneId ? "Milestone selected" : "Milestone"}
              </span>
              <i className="bi bi-chevron-right" />
              <span>Tasks</span>
            </div>
          </div>

          <div className="hierarchy-layout">
            <div className="hierarchy-grid">
              <article className="hierarchy-column">
                <div className="hierarchy-column-head">
                  <h3>
                    <i className="bi bi-layers me-1" />
                    Phases
                  </h3>
                  <button
                    type="button"
                    className="btn btn-info text-white btn-sm"
                    onClick={() => setShowCreatePhase((prev) => !prev)}
                  >
                    {showCreatePhase ? "Cancel" : "+ Add"}
                  </button>
                </div>

                {showCreatePhase && (
                  <div className="task-create-card mb-3">
                    <form className="row g-2" onSubmit={handleCreatePhase}>
                      <div className="col-12">
                        <label className="form-label mb-1">Phase Name</label>
                        <input
                          className="form-control"
                          name="name"
                          value={newPhase.name}
                          onChange={handleNewPhaseChange}
                          placeholder="Phase name"
                          maxLength={120}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label mb-1">Start Date</label>
                        <input
                          className="form-control"
                          type="date"
                          name="startDateUtc"
                          value={newPhase.startDateUtc}
                          onChange={handleNewPhaseChange}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label mb-1">End Date</label>
                        <input
                          className="form-control"
                          type="date"
                          name="endDateUtc"
                          value={newPhase.endDateUtc}
                          onChange={handleNewPhaseChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label mb-1">Deliverables</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          name="deliverables"
                          value={newPhase.deliverables}
                          onChange={handleNewPhaseChange}
                          maxLength={1000}
                        />
                      </div>
                      <div className="col-12 d-flex justify-content-between align-items-center">
                        <label className="form-check-label d-flex align-items-center gap-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="isGatePassed"
                            checked={newPhase.isGatePassed}
                            onChange={handleNewPhaseChange}
                          />
                          Mark as Gate Passed
                        </label>
                        <button
                          type="submit"
                          className="btn btn-success btn-sm"
                          disabled={creatingPhase}
                        >
                          {creatingPhase ? "Creating..." : "Create"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {phasesLoading ? (
                  <div className="text-center py-3">
                    <div
                      className="spinner-border spinner-border-sm text-info"
                      role="status"
                    />
                  </div>
                ) : phases.length === 0 ? (
                  <div className="tasks-empty-message">
                    <i className="bi bi-inbox" />
                    No phases yet.
                  </div>
                ) : (
                  <div className="hierarchy-list">
                    {phases.map((p) => (
                      <div
                        key={p.id}
                        className={`hierarchy-item ${selectedPhaseId === p.id ? "selected" : ""}`}
                      >
                        {editingPhaseId === p.id ? (
                          <div className="w-100 inline-edit-form">
                            <div className="inline-edit-field">
                              <label className="inline-edit-label">
                                Phase Name
                              </label>
                              <input
                                className="form-control form-control-sm"
                                name="name"
                                value={editPhaseForm.name}
                                onChange={handleEditPhaseChange}
                                maxLength={120}
                                required
                              />
                            </div>
                            <div className="d-flex gap-2 inline-edit-row">
                              <div className="inline-edit-field flex-fill">
                                <label className="inline-edit-label">
                                  Start Date
                                </label>
                                <input
                                  className="form-control form-control-sm"
                                  type="date"
                                  name="startDateUtc"
                                  value={editPhaseForm.startDateUtc}
                                  onChange={handleEditPhaseChange}
                                />
                              </div>
                              <div className="inline-edit-field flex-fill">
                                <label className="inline-edit-label">
                                  End Date
                                </label>
                                <input
                                  className="form-control form-control-sm"
                                  type="date"
                                  name="endDateUtc"
                                  value={editPhaseForm.endDateUtc}
                                  onChange={handleEditPhaseChange}
                                />
                              </div>
                            </div>
                            <div className="inline-edit-field">
                              <label className="inline-edit-label">
                                Deliverables
                              </label>
                              <textarea
                                className="form-control form-control-sm"
                                rows={2}
                                name="deliverables"
                                value={editPhaseForm.deliverables}
                                onChange={handleEditPhaseChange}
                                maxLength={1000}
                              />
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <label className="form-check-label d-flex align-items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  name="isGatePassed"
                                  checked={editPhaseForm.isGatePassed}
                                  onChange={handleEditPhaseChange}
                                />
                                Gate passed
                              </label>
                              <div className="task-row-actions">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleUpdatePhase(p)}
                                >
                                  <i className="bi bi-check-lg" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => setEditingPhaseId(null)}
                                >
                                  <i className="bi bi-x-lg" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="hierarchy-item-main"
                              onClick={() => {
                                setSelectedPhaseId(p.id);
                                setSelectedMilestoneId(null);
                                setTasks([]);
                                setShowCreateTask(false);
                                setShowCreateMilestone(false);
                              }}
                            >
                              <strong>{p.name || "Unnamed"}</strong>
                              <span>
                                {p.startDateUtc
                                  ? new Date(
                                      p.startDateUtc,
                                    ).toLocaleDateString()
                                  : "No start date"}
                              </span>
                            </button>
                            <div className="task-row-actions">
                              {confirmDeletePhaseId === p.id ? (
                                <span className="confirm-inline confirm-inline-sm">
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
                                    onClick={() =>
                                      setConfirmDeletePhaseId(null)
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
                                    onClick={() => startEditPhase(p)}
                                  >
                                    <i className="bi bi-pencil" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() =>
                                      setConfirmDeletePhaseId(p.id)
                                    }
                                  >
                                    <i className="bi bi-trash" />
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="hierarchy-column">
                <div className="hierarchy-column-head">
                  <h3>
                    <i className="bi bi-signpost-2 me-1" />
                    Milestones
                  </h3>
                  <button
                    type="button"
                    className="btn btn-info text-white btn-sm"
                    disabled={!selectedPhaseId}
                    onClick={() => setShowCreateMilestone((prev) => !prev)}
                  >
                    {showCreateMilestone ? "Cancel" : "+ Add"}
                  </button>
                </div>

                {!selectedPhaseId ? (
                  <div className="tasks-empty-message">
                    <i className="bi bi-arrow-left-circle" />
                    Select a phase to view milestones
                  </div>
                ) : (
                  <>
                    {showCreateMilestone && (
                      <div className="task-create-card mb-3">
                        <form
                          className="row g-2"
                          onSubmit={handleCreateMilestone}
                        >
                          <div className="col-12">
                            <label className="form-label mb-1">
                              Milestone Name
                            </label>
                            <input
                              className="form-control"
                              name="name"
                              value={newMilestone.name}
                              onChange={handleNewMilestoneChange}
                              placeholder="Milestone name"
                              maxLength={150}
                              required
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label mb-1">
                              Target Date
                            </label>
                            <input
                              className="form-control"
                              type="date"
                              name="targetDateUtc"
                              value={newMilestone.targetDateUtc}
                              onChange={handleNewMilestoneChange}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label mb-1">
                              Success Criteria
                            </label>
                            <textarea
                              className="form-control"
                              rows={2}
                              name="successCriteria"
                              value={newMilestone.successCriteria}
                              onChange={handleNewMilestoneChange}
                              placeholder="Success criteria"
                              maxLength={1000}
                            />
                          </div>
                          <div className="col-12 d-flex justify-content-between align-items-center">
                            <label className="form-check-label d-flex align-items-center gap-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                name="isCompleted"
                                checked={newMilestone.isCompleted}
                                onChange={handleNewMilestoneChange}
                              />
                              Mark as Completed
                            </label>
                            <button
                              type="submit"
                              className="btn btn-success btn-sm"
                              disabled={creatingMilestone}
                            >
                              {creatingMilestone ? "Creating..." : "Create"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {milestonesLoading ? (
                      <div className="text-center py-3">
                        <div
                          className="spinner-border spinner-border-sm text-info"
                          role="status"
                        />
                      </div>
                    ) : milestones.length === 0 ? (
                      <div className="tasks-empty-message">
                        <i className="bi bi-inbox" />
                        No milestones for this phase.
                      </div>
                    ) : (
                      <div className="hierarchy-list">
                        {milestones.map((m) => (
                          <div
                            key={m.id}
                            className={`hierarchy-item ${selectedMilestoneId === m.id ? "selected" : ""}`}
                          >
                            {editingMilestoneId === m.id ? (
                              <div className="w-100 inline-edit-form">
                                <div className="inline-edit-field">
                                  <label className="inline-edit-label">
                                    Milestone Name
                                  </label>
                                  <input
                                    className="form-control form-control-sm"
                                    name="name"
                                    value={editMilestoneForm.name}
                                    onChange={handleEditMilestoneChange}
                                    maxLength={150}
                                    required
                                  />
                                </div>
                                <div className="inline-edit-field">
                                  <label className="inline-edit-label">
                                    Target Date
                                  </label>
                                  <input
                                    className="form-control form-control-sm"
                                    type="date"
                                    name="targetDateUtc"
                                    value={editMilestoneForm.targetDateUtc}
                                    onChange={handleEditMilestoneChange}
                                  />
                                </div>
                                <div className="inline-edit-field">
                                  <label className="inline-edit-label">
                                    Actual Date
                                  </label>
                                  <input
                                    className="form-control form-control-sm"
                                    type="date"
                                    name="actualDateUtc"
                                    value={editMilestoneForm.actualDateUtc}
                                    onChange={handleEditMilestoneChange}
                                  />
                                </div>
                                <div className="inline-edit-field">
                                  <label className="inline-edit-label">
                                    Success Criteria
                                  </label>
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    name="successCriteria"
                                    value={editMilestoneForm.successCriteria}
                                    onChange={handleEditMilestoneChange}
                                    maxLength={1000}
                                  />
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <label className="form-check-label d-flex align-items-center gap-2">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      name="isCompleted"
                                      checked={editMilestoneForm.isCompleted}
                                      onChange={handleEditMilestoneChange}
                                    />
                                    Completed
                                  </label>
                                  <div className="task-row-actions">
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleUpdateMilestone(m)}
                                    >
                                      <i className="bi bi-check-lg" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={() =>
                                        setEditingMilestoneId(null)
                                      }
                                    >
                                      <i className="bi bi-x-lg" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="hierarchy-item-main"
                                  onClick={() => {
                                    setSelectedMilestoneId(m.id);
                                    setShowCreateTask(false);
                                  }}
                                >
                                  <strong>{m.name || "Unnamed"}</strong>
                                  <span>
                                    {m.targetDateUtc
                                      ? new Date(
                                          m.targetDateUtc,
                                        ).toLocaleDateString()
                                      : "No target date"}
                                  </span>
                                </button>
                                <div className="task-row-actions">
                                  {confirmDeleteMilestoneId === m.id ? (
                                    <span className="confirm-inline confirm-inline-sm">
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                          handleDeleteMilestone(m.id)
                                        }
                                      >
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() =>
                                          setConfirmDeleteMilestoneId(null)
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
                                        onClick={() => startEditMilestone(m)}
                                      >
                                        <i className="bi bi-pencil" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() =>
                                          setConfirmDeleteMilestoneId(m.id)
                                        }
                                      >
                                        <i className="bi bi-trash" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </article>

              <article className="hierarchy-column">
                <div className="hierarchy-column-head">
                  <h3>
                    <i className="bi bi-check2-square me-1" />
                    Tasks
                  </h3>
                  <button
                    type="button"
                    className="btn btn-info text-white btn-sm"
                    disabled={!selectedMilestoneId}
                    onClick={() => setShowCreateTask((prev) => !prev)}
                  >
                    {showCreateTask ? "Cancel" : "+ Add"}
                  </button>
                </div>

                {!selectedMilestoneId ? (
                  <div className="tasks-empty-message">
                    <i className="bi bi-arrow-left-circle" />
                    Select a milestone to view tasks
                  </div>
                ) : (
                  <>
                    {showCreateTask && (
                      <div className="task-create-card mb-3">
                        <form className="row g-2" onSubmit={handleCreateTask}>
                          <div className="col-12">
                            <label className="form-label mb-1">
                              Task Title
                            </label>
                            <input
                              className="form-control"
                              name="title"
                              value={newTask.title}
                              onChange={handleNewTaskChange}
                              placeholder="Task title"
                              maxLength={180}
                              required
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label mb-1">Priority</label>
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
                          <div className="col-6">
                            <label className="form-label mb-1">Status</label>
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
                          <div className="col-6">
                            <label className="form-label mb-1">
                              Start Date
                            </label>
                            <input
                              className="form-control"
                              type="date"
                              name="startDateUtc"
                              value={newTask.startDateUtc}
                              onChange={handleNewTaskChange}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label mb-1">Due Date</label>
                            <input
                              className="form-control"
                              type="date"
                              name="dueDateUtc"
                              value={newTask.dueDateUtc}
                              onChange={handleNewTaskChange}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label mb-1">
                              Completion Percentage
                            </label>
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
                          <div className="col-6">
                            <label className="form-label mb-1">
                              Effort Estimate (Hours)
                            </label>
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
                          <div className="col-12">
                            <label className="form-label mb-1">
                              Description
                            </label>
                            <textarea
                              className="form-control"
                              rows={2}
                              name="description"
                              value={newTask.description}
                              onChange={handleNewTaskChange}
                              maxLength={2000}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label mb-1">
                              Assign To (Project Member)
                            </label>
                            <div
                              className="employee-dropdown-wrap"
                              ref={memberDropdownRef}
                            >
                              <div
                                className="employee-selected-input"
                                onClick={() =>
                                  setShowMemberDropdown((prev) => !prev)
                                }
                              >
                                {newTask.assignedToMemberId ? (
                                  <span className="employee-selected-name">
                                    <i className="bi bi-person-fill me-1" />
                                    {getMemberDisplayName(
                                      newTask.assignedToMemberId,
                                    ) || newTask.assignedToMemberId}
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
                                    onChange={(e) =>
                                      setMemberSearch(e.target.value)
                                    }
                                    autoFocus
                                  />
                                  <div className="employee-options">
                                    {filteredMembers.length === 0 ? (
                                      <div className="employee-option-empty">
                                        No project members found.
                                      </div>
                                    ) : (
                                      filteredMembers.map((m) => (
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
                          </div>
                          <div className="col-12 text-end">
                            <button
                              type="submit"
                              className="btn btn-success btn-sm"
                              disabled={creatingTask}
                            >
                              {creatingTask ? "Creating..." : "Create"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {tasksLoading ? (
                      <div className="text-center py-3">
                        <div
                          className="spinner-border spinner-border-sm text-info"
                          role="status"
                        />
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="tasks-empty-message">
                        <i className="bi bi-inbox" />
                        No tasks for this milestone.
                      </div>
                    ) : (
                      <div className="hierarchy-list">
                        {tasks.map((t) => {
                          const assignee = getTaskAssigneeInfo(t);

                          return (
                            <div key={t.id} className="hierarchy-item">
                              <button
                                type="button"
                                className="hierarchy-item-main"
                                onClick={() =>
                                  navigate(
                                    `/dashboard/portfolios/${portfolioId}/projects/${projectId}/tasks/${t.id}`,
                                  )
                                }
                              >
                                <strong>{t.title || "Untitled"}</strong>
                                <span>
                                  {TaskStatusEnum[t.status ?? 0] || "Unknown"} ·{" "}
                                  {t.completionPercentage ?? 0}%
                                </span>
                                <span className="task-assignee-line">
                                  <span className="task-assignee-label">
                                    Assignee:
                                  </span>
                                  <span className="task-assignee-name">
                                    {assignee.label}
                                  </span>
                                  {assignee.type && (
                                    <span
                                      className={`task-assignee-badge ${
                                        assignee.type === "hr" ? "hr" : "member"
                                      }`}
                                    >
                                      {assignee.type === "hr"
                                        ? "HR employee"
                                        : "Project member"}
                                    </span>
                                  )}
                                </span>
                              </button>
                              <div className="task-row-actions">
                                {confirmDeleteTaskId === t.id ? (
                                  <span className="confirm-inline confirm-inline-sm">
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
                                      onClick={() =>
                                        setConfirmDeleteTaskId(null)
                                      }
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
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </article>
            </div>

            <div className="details-row-grid">
              <aside
                className="hierarchy-sidebar"
                aria-label="Selection details"
              >
                <div className="hierarchy-sidebar-head">
                  <h3>
                    <i className="bi bi-card-text me-2" />
                    Details
                  </h3>
                  <span className="details-pill">Live Context</span>
                </div>

                {!selectedPhase && !selectedMilestone ? (
                  <div className="hierarchy-sidebar-empty">
                    <i className="bi bi-info-circle" />
                    <p className="mb-0">
                      Select a phase or milestone to view complete details.
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedPhase && (
                      <section className="detail-card">
                        <div className="detail-card-head">
                          <h4>Phase Details</h4>
                          <span
                            className={`detail-status ${selectedPhase.isGatePassed ? "ok" : "pending"}`}
                          >
                            {selectedPhase.isGatePassed
                              ? "Gate Passed"
                              : "Pending Gate"}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span>Name</span>
                          <strong>{selectedPhase.name || "Unnamed"}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Start Date</span>
                          <strong>
                            {selectedPhase.startDateUtc
                              ? new Date(
                                  selectedPhase.startDateUtc,
                                ).toLocaleDateString()
                              : "N/A"}
                          </strong>
                        </div>
                        <div className="detail-row">
                          <span>End Date</span>
                          <strong>
                            {selectedPhase.endDateUtc
                              ? new Date(
                                  selectedPhase.endDateUtc,
                                ).toLocaleDateString()
                              : "N/A"}
                          </strong>
                        </div>
                        <div className="detail-row">
                          <span>Milestones</span>
                          <strong>{milestones.length}</strong>
                        </div>
                        <div className="detail-row detail-block">
                          <span>Deliverables</span>
                          <p className="mb-0">
                            {selectedPhase.deliverables ||
                              "No deliverables recorded."}
                          </p>
                        </div>
                        <div className="detail-row detail-id">
                          <span>Phase ID</span>
                          <strong>{selectedPhase.id}</strong>
                        </div>
                      </section>
                    )}

                    {selectedMilestone && (
                      <section className="detail-card">
                        <div className="detail-card-head">
                          <h4>Milestone Details</h4>
                          <span
                            className={`detail-status ${selectedMilestone.isCompleted ? "ok" : "pending"}`}
                          >
                            {selectedMilestone.isCompleted
                              ? "Completed"
                              : "In Progress"}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span>Name</span>
                          <strong>{selectedMilestone.name || "Unnamed"}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Target Date</span>
                          <strong>
                            {selectedMilestone.targetDateUtc
                              ? new Date(
                                  selectedMilestone.targetDateUtc,
                                ).toLocaleDateString()
                              : "N/A"}
                          </strong>
                        </div>
                        <div className="detail-row">
                          <span>Actual Date</span>
                          <strong>
                            {selectedMilestone.actualDateUtc
                              ? new Date(
                                  selectedMilestone.actualDateUtc,
                                ).toLocaleDateString()
                              : "N/A"}
                          </strong>
                        </div>
                        <div className="detail-row">
                          <span>Tasks</span>
                          <strong>{tasks.length}</strong>
                        </div>
                        <div className="detail-row detail-block">
                          <span>Success Criteria</span>
                          <p className="mb-0">
                            {selectedMilestone.successCriteria ||
                              "No success criteria recorded."}
                          </p>
                        </div>
                        <div className="detail-approvals-section">
                          <div className="detail-approvals-head">
                            <h5>
                              <i className="bi bi-check2-square me-1" />
                              Approvals
                            </h5>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() =>
                                setShowCreateApproval((prev) => !prev)
                              }
                              disabled={!currentUserId}
                            >
                              {showCreateApproval ? "Cancel" : "Add Approval"}
                            </button>
                          </div>

                          {!currentUserId && (
                            <p className="detail-approvals-note mb-2">
                              Unable to detect the logged-in user for
                              approverId.
                            </p>
                          )}

                          {showCreateApproval && (
                            <div className="detail-approval-form mb-2">
                              <div className="row g-2">
                                <div className="col-12 col-md-4">
                                  <label className="form-label mb-1">
                                    Status
                                  </label>
                                  <select
                                    className="form-select form-select-sm"
                                    name="status"
                                    value={newApprovalForm.status}
                                    onChange={handleNewApprovalChange}
                                  >
                                    {Object.entries(ApprovalStatus).map(
                                      ([value, label]) => (
                                        <option key={value} value={value}>
                                          {label}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                                <div className="col-12 col-md-8">
                                  <label className="form-label mb-1">
                                    Decided At
                                  </label>
                                  <input
                                    className="form-control form-control-sm"
                                    type="datetime-local"
                                    name="decidedAtUtc"
                                    value={newApprovalForm.decidedAtUtc}
                                    onChange={handleNewApprovalChange}
                                  />
                                </div>
                                <div className="col-12">
                                  <label className="form-label mb-1">
                                    Comments
                                  </label>
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    name="comments"
                                    value={newApprovalForm.comments}
                                    onChange={handleNewApprovalChange}
                                    maxLength={1000}
                                  />
                                </div>
                                <div className="col-12 text-end">
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={handleCreateApproval}
                                    disabled={
                                      creatingApproval || !currentUserId
                                    }
                                  >
                                    {creatingApproval
                                      ? "Adding..."
                                      : "Save Approval"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {approvalsLoading ? (
                            <div className="text-center py-2">
                              <div
                                className="spinner-border spinner-border-sm text-info"
                                role="status"
                              />
                            </div>
                          ) : milestoneApprovals.length === 0 ? (
                            <p className="detail-approvals-note mb-0">
                              No approvals for this milestone.
                            </p>
                          ) : (
                            <div className="detail-approvals-list">
                              {milestoneApprovals.map((approval) => (
                                <div
                                  key={approval.id}
                                  className="detail-approval-item"
                                >
                                  {editingApprovalId === approval.id ? (
                                    <div className="detail-approval-form">
                                      <div className="row g-2">
                                        <div className="col-12 col-md-4">
                                          <label className="form-label mb-1">
                                            Status
                                          </label>
                                          <select
                                            className="form-select form-select-sm"
                                            name="status"
                                            value={editApprovalForm.status}
                                            onChange={handleEditApprovalChange}
                                          >
                                            {Object.entries(ApprovalStatus).map(
                                              ([value, label]) => (
                                                <option
                                                  key={value}
                                                  value={value}
                                                >
                                                  {label}
                                                </option>
                                              ),
                                            )}
                                          </select>
                                        </div>
                                        <div className="col-12 col-md-8">
                                          <label className="form-label mb-1">
                                            Decided At
                                          </label>
                                          <input
                                            className="form-control form-control-sm"
                                            type="datetime-local"
                                            name="decidedAtUtc"
                                            value={
                                              editApprovalForm.decidedAtUtc
                                            }
                                            onChange={handleEditApprovalChange}
                                          />
                                        </div>
                                        <div className="col-12">
                                          <label className="form-label mb-1">
                                            Comments
                                          </label>
                                          <textarea
                                            className="form-control form-control-sm"
                                            rows={2}
                                            name="comments"
                                            value={editApprovalForm.comments}
                                            onChange={handleEditApprovalChange}
                                            maxLength={1000}
                                          />
                                        </div>
                                        <div className="col-12 d-flex justify-content-end gap-2">
                                          <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={() =>
                                              handleUpdateApproval(approval)
                                            }
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() =>
                                              setEditingApprovalId(null)
                                            }
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="detail-approval-main">
                                        <span
                                          className={`approval-status-badge approval-status-${approval.status ?? 0}`}
                                        >
                                          {ApprovalStatus[
                                            approval.status ?? 0
                                          ] || "Unknown"}
                                        </span>
                                        <strong>
                                          {getApproverDisplayName(
                                            approval.approverId,
                                          )}
                                        </strong>
                                        <small>
                                          {formatDate(
                                            approval.decidedAtUtc ||
                                              approval.createdDateUtc,
                                          )}
                                        </small>
                                        <p>
                                          {approval.comments ||
                                            "No comments provided."}
                                        </p>
                                      </div>
                                      <div className="task-row-actions">
                                        {confirmDeleteApprovalId ===
                                        approval.id ? (
                                          <span className="confirm-inline confirm-inline-sm">
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm"
                                              onClick={() =>
                                                handleDeleteApproval(
                                                  approval.id,
                                                )
                                              }
                                            >
                                              Yes
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-outline-secondary btn-sm"
                                              onClick={() =>
                                                setConfirmDeleteApprovalId(null)
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
                                              onClick={() =>
                                                startEditApproval(approval)
                                              }
                                            >
                                              <i className="bi bi-pencil" />
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-outline-danger btn-sm"
                                              onClick={() =>
                                                setConfirmDeleteApprovalId(
                                                  approval.id,
                                                )
                                              }
                                            >
                                              <i className="bi bi-trash" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="detail-row detail-id">
                          <span>Milestone ID</span>
                          <strong>{selectedMilestone.id}</strong>
                        </div>
                      </section>
                    )}
                  </>
                )}
              </aside>

              <aside
                className="hierarchy-sidebar hierarchy-visual"
                aria-label="Phase visual analytics"
              >
                <div className="hierarchy-sidebar-head">
                  <h3>
                    <i className="bi bi-bar-chart-line me-2" />
                    Visual Summary
                  </h3>
                  <span className="details-pill">Phase Analytics</span>
                </div>

                {!selectedPhase ? (
                  <div className="hierarchy-sidebar-empty">
                    <i className="bi bi-graph-up" />
                    <p className="mb-0">
                      Select a phase to view milestones and tasks visualization.
                    </p>
                  </div>
                ) : phaseVisualLoading ? (
                  <div className="text-center py-3">
                    <div
                      className="spinner-border spinner-border-sm text-info"
                      role="status"
                    />
                  </div>
                ) : (
                  <>
                    <section className="detail-card visual-summary-card">
                      <h4 className="visual-heading">Phase Progress</h4>
                      <div className="visual-kpi-row">
                        <div className="visual-kpi">
                          <span>Milestones</span>
                          <strong>
                            {phaseVisualSummary.completedMilestones}/
                            {phaseVisualSummary.totalMilestones}
                          </strong>
                        </div>
                        <div className="visual-kpi">
                          <span>Tasks</span>
                          <strong>
                            {phaseVisualSummary.taskTotals.completed}/
                            {phaseVisualSummary.taskTotals.total}
                          </strong>
                        </div>
                      </div>

                      <div className="visual-progress-block">
                        <div className="visual-progress-head">
                          <span>Milestone Completion</span>
                          <strong>
                            {phaseVisualSummary.milestoneProgressPercent}%
                          </strong>
                        </div>
                        <div className="visual-progress-track">
                          <span
                            className="visual-progress-fill ok"
                            style={{
                              width: `${phaseVisualSummary.milestoneProgressPercent}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="visual-progress-block">
                        <div className="visual-progress-head">
                          <span>Task Completion</span>
                          <strong>
                            {phaseVisualSummary.taskProgressPercent}%
                          </strong>
                        </div>
                        <div className="visual-progress-track">
                          <span
                            className="visual-progress-fill progress"
                            style={{
                              width: `${phaseVisualSummary.taskProgressPercent}%`,
                            }}
                          />
                        </div>
                      </div>

                      <p className="visual-status-note mb-0">
                        Task completion is calculated from tasks with status
                        "Done" only.
                      </p>
                    </section>

                    <section className="detail-card visual-list-card">
                      <h4 className="visual-heading">Milestone Breakdown</h4>
                      {phaseMilestoneVisualRows.length === 0 ? (
                        <p className="mb-0 visual-empty-text">
                          No milestones available for this phase.
                        </p>
                      ) : (
                        <div className="visual-milestone-list">
                          {phaseMilestoneVisualRows.map((row) => (
                            <div key={row.id} className="visual-milestone-item">
                              <div className="visual-milestone-head">
                                <strong>{row.name}</strong>
                                <span
                                  className={`visual-badge ${
                                    row.milestoneStatus === "Completed"
                                      ? "ok"
                                      : row.milestoneStatus === "Active"
                                        ? "progress"
                                        : "idle"
                                  }`}
                                >
                                  {row.milestoneStatus}
                                </span>
                              </div>
                              <div className="visual-progress-track small">
                                <span
                                  className="visual-progress-fill progress"
                                  style={{ width: `${row.completionPercent}%` }}
                                />
                              </div>
                              <div className="visual-task-stats">
                                {Object.entries(TaskStatusEnum).map(
                                  ([statusKey, label]) => {
                                    const status = Number(statusKey);
                                    const count = row.statusCounts[status] || 0;

                                    return (
                                      <span
                                        key={`${row.id}-${status}`}
                                        className="visual-task-chip"
                                      >
                                        <i
                                          className="visual-task-chip-dot"
                                          style={{
                                            background:
                                              getTaskStatusColor(status),
                                          }}
                                        />
                                        {label}: {count}
                                      </span>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </aside>
            </div>
          </div>
        </section>
      )}

      {/* ── Risks Section ── */}
      {activeTab === "risks" && (
        <section className="tasks-section">
          <div className="tasks-section-header">
            <h2>
              <i className="bi bi-shield-exclamation me-2" />
              Risk Management
            </h2>
            <button
              type="button"
              className="btn btn-info text-white btn-sm"
              onClick={() => setShowCreateRisk((prev) => !prev)}
            >
              <i
                className={`bi ${showCreateRisk ? "bi-x-circle" : "bi-plus-lg"} me-1`}
              />
              {showCreateRisk ? "Cancel" : "New Risk"}
            </button>
          </div>

          <div className="risk-charts-grid mb-3">
            <article className="details-card risk-chart-card">
              <div className="finance-chart-header">
                <h3 className="h6 mb-1">Project Risk Severity Summary</h3>
                <p className="mb-0">
                  Distribution of risks by derived severity from impact and
                  probability.
                </p>
              </div>
              <div className="finance-chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskSummaryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                    >
                      {riskSummaryData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="details-card risk-chart-card">
              <div className="finance-chart-header">
                <h3 className="h6 mb-1">Events Per Risk</h3>
                <p className="mb-0">
                  Number of events linked to each risk. Expanding risks updates
                  this chart in real time.
                </p>
              </div>
              <div className="finance-chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskEventsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6eef5" />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={58}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="events"
                      fill="#1b4965"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <div className="details-card mb-3">
            <div className="risk-controls-row">
              <div className="risk-control-item">
                <label className="form-label mb-1">Filter by Severity</label>
                <select
                  className="form-select"
                  value={riskSeverityFilter}
                  onChange={(event) =>
                    setRiskSeverityFilter(
                      event.target.value as "all" | "high" | "medium" | "low",
                    )
                  }
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="risk-control-item">
                <label className="form-label mb-1">Sort By</label>
                <select
                  className="form-select"
                  value={riskSortBy}
                  onChange={(event) =>
                    setRiskSortBy(
                      event.target.value as
                        | "recent"
                        | "impact"
                        | "probability"
                        | "severity",
                    )
                  }
                >
                  <option value="severity">Severity (Highest First)</option>
                  <option value="impact">Impact</option>
                  <option value="probability">Probability</option>
                  <option value="recent">Recently Created</option>
                </select>
              </div>
            </div>
          </div>

          {showCreateRisk && (
            <div className="task-create-card mb-3">
              <h3 className="h6 mb-3">Create Risk</h3>
              <form className="row g-3" onSubmit={handleCreateRisk}>
                <div className="col-12">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    name="description"
                    value={newRisk.description}
                    onChange={handleNewRiskChange}
                    maxLength={500}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Probability</label>
                  <select
                    className="form-select"
                    name="probability"
                    value={newRisk.probability}
                    onChange={handleNewRiskChange}
                  >
                    {Object.entries(RiskProbability).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Impact</label>
                  <select
                    className="form-select"
                    name="impact"
                    value={newRisk.impact}
                    onChange={handleNewRiskChange}
                  >
                    {Object.entries(RiskImpact).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Owner ID</label>
                  <input
                    className="form-control"
                    name="ownerId"
                    value={newRisk.ownerId}
                    onChange={handleNewRiskChange}
                    maxLength={100}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Mitigation Plan</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    name="mitigationPlan"
                    value={newRisk.mitigationPlan}
                    onChange={handleNewRiskChange}
                    maxLength={1000}
                  />
                </div>
                <div className="col-12 text-end">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={creatingRisk}
                  >
                    {creatingRisk ? "Creating..." : "Create Risk"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {risksLoading ? (
            <div className="text-center py-4">
              <div
                className="spinner-border spinner-border-sm text-info"
                role="status"
              />
            </div>
          ) : displayedRisks.length === 0 ? (
            <div className="tasks-table-wrap">
              <div className="tasks-empty-message">
                <i className="bi bi-inbox" />
                No risks found for this filter.
              </div>
            </div>
          ) : (
            <div className="risk-list-wrap">
              {displayedRisks.map((risk) => {
                const isExpanded = expandedRiskId === risk.id;
                const events = riskEventsByRisk[risk.id] || [];
                const eventsLoading = riskEventsLoadingByRisk[risk.id];
                const severityBucket = getRiskSeverityBucket(risk);

                return (
                  <article
                    key={risk.id}
                    className="details-card risk-item-card"
                  >
                    {editingRiskId === risk.id ? (
                      <div className="risk-edit-block">
                        <div className="row g-2">
                          <div className="col-12">
                            <label className="form-label mb-1">
                              Description *
                            </label>
                            <textarea
                              className="form-control"
                              rows={2}
                              name="description"
                              value={editRiskForm.description}
                              onChange={handleEditRiskChange}
                              maxLength={500}
                              required
                            />
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label mb-1">
                              Probability
                            </label>
                            <select
                              className="form-select"
                              name="probability"
                              value={editRiskForm.probability}
                              onChange={handleEditRiskChange}
                            >
                              {Object.entries(RiskProbability).map(
                                ([key, label]) => (
                                  <option key={key} value={key}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label mb-1">Impact</label>
                            <select
                              className="form-select"
                              name="impact"
                              value={editRiskForm.impact}
                              onChange={handleEditRiskChange}
                            >
                              {Object.entries(RiskImpact).map(
                                ([key, label]) => (
                                  <option key={key} value={key}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label mb-1">Owner ID</label>
                            <input
                              className="form-control"
                              name="ownerId"
                              value={editRiskForm.ownerId}
                              onChange={handleEditRiskChange}
                              maxLength={100}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label mb-1">
                              Mitigation Plan
                            </label>
                            <textarea
                              className="form-control"
                              rows={2}
                              name="mitigationPlan"
                              value={editRiskForm.mitigationPlan}
                              onChange={handleEditRiskChange}
                              maxLength={1000}
                            />
                          </div>
                        </div>
                        <div className="task-row-actions justify-content-end mt-2">
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateRisk(risk)}
                          >
                            <i className="bi bi-check-lg" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setEditingRiskId(null)}
                          >
                            <i className="bi bi-x-lg" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="risk-item-head">
                          <div className="risk-item-summary">
                            <h3>{risk.description || "Unnamed risk"}</h3>
                            <div className="risk-item-meta">
                              <span
                                className="task-row-badge"
                                style={{
                                  background:
                                    getRiskSeverityColor(severityBucket),
                                }}
                              >
                                {getRiskSeverityLabel(risk)}
                              </span>
                              <span>
                                Probability:{" "}
                                {RiskProbability[risk.probability ?? 0]}
                              </span>
                              <span>
                                Impact: {RiskImpact[risk.impact ?? 0]}
                              </span>
                              <span>Owner: {risk.ownerId || "N/A"}</span>
                            </div>
                          </div>
                          <div className="task-row-actions">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => startEditRisk(risk)}
                              title="Edit risk"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            {confirmDeleteRiskId === risk.id ? (
                              <span className="confirm-inline confirm-inline-sm">
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteRisk(risk.id)}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => setConfirmDeleteRiskId(null)}
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => setConfirmDeleteRiskId(risk.id)}
                                title="Delete risk"
                              >
                                <i className="bi bi-trash" />
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline-info btn-sm"
                              onClick={() => handleToggleRiskExpansion(risk.id)}
                              title="Show events"
                            >
                              <i
                                className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`}
                              />
                              <span className="ms-1">Events</span>
                            </button>
                          </div>
                        </div>
                        <p className="risk-mitigation-text mb-0">
                          {risk.mitigationPlan ||
                            "No mitigation plan provided."}
                        </p>
                      </>
                    )}

                    {isExpanded && (
                      <div className="risk-events-panel">
                        <div className="risk-events-head">
                          <h4 className="h6 mb-0">
                            Linked Events ({events.length})
                          </h4>
                          <button
                            type="button"
                            className="btn btn-outline-info btn-sm"
                            onClick={() =>
                              setShowCreateEventForRiskId((prev) =>
                                prev === risk.id ? null : risk.id,
                              )
                            }
                          >
                            {showCreateEventForRiskId === risk.id
                              ? "Cancel"
                              : "+ Add Event"}
                          </button>
                        </div>

                        {showCreateEventForRiskId === risk.id && (
                          <form
                            className="row g-2 risk-event-create"
                            onSubmit={(event) =>
                              handleCreateRiskEvent(event, risk.id)
                            }
                          >
                            <div className="col-12">
                              <label className="form-label mb-1">
                                Incident Description *
                              </label>
                              <textarea
                                className="form-control"
                                rows={2}
                                name="incidentDescription"
                                value={newRiskEvent.incidentDescription}
                                onChange={handleNewRiskEventChange}
                                maxLength={1000}
                                required
                              />
                            </div>
                            <div className="col-12 col-md-4">
                              <label className="form-label mb-1">Status</label>
                              <select
                                className="form-select"
                                name="status"
                                value={newRiskEvent.status}
                                onChange={handleNewRiskEventChange}
                              >
                                {Object.entries(RiskEventStatus).map(
                                  ([key, label]) => (
                                    <option key={key} value={key}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                            <div className="col-12 col-md-4">
                              <label className="form-label mb-1">
                                Occurred Date
                              </label>
                              <input
                                className="form-control"
                                type="date"
                                name="occurredAtUtc"
                                value={newRiskEvent.occurredAtUtc}
                                onChange={handleNewRiskEventChange}
                              />
                            </div>
                            <div className="col-12 col-md-4 d-flex align-items-end justify-content-end">
                              <button
                                type="submit"
                                className="btn btn-success btn-sm"
                                disabled={creatingRiskEvent}
                              >
                                {creatingRiskEvent
                                  ? "Creating..."
                                  : "Create Event"}
                              </button>
                            </div>
                          </form>
                        )}

                        {eventsLoading ? (
                          <div className="text-center py-3">
                            <div
                              className="spinner-border spinner-border-sm text-info"
                              role="status"
                            />
                          </div>
                        ) : events.length === 0 ? (
                          <div className="tasks-empty-message py-3">
                            No events recorded for this risk.
                          </div>
                        ) : (
                          <div className="risk-events-list">
                            {events.map((eventItem) => (
                              <div
                                key={eventItem.id}
                                className="risk-event-item"
                              >
                                {editingRiskEventId === eventItem.id ? (
                                  <div className="row g-2 w-100">
                                    <div className="col-12">
                                      <label className="form-label mb-1">
                                        Incident Description *
                                      </label>
                                      <textarea
                                        className="form-control"
                                        rows={2}
                                        name="incidentDescription"
                                        value={
                                          editRiskEventForm.incidentDescription
                                        }
                                        onChange={handleEditRiskEventChange}
                                        maxLength={1000}
                                        required
                                      />
                                    </div>
                                    <div className="col-12 col-md-4">
                                      <label className="form-label mb-1">
                                        Status
                                      </label>
                                      <select
                                        className="form-select"
                                        name="status"
                                        value={editRiskEventForm.status}
                                        onChange={handleEditRiskEventChange}
                                      >
                                        {Object.entries(RiskEventStatus).map(
                                          ([key, label]) => (
                                            <option key={key} value={key}>
                                              {label}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    </div>
                                    <div className="col-12 col-md-4">
                                      <label className="form-label mb-1">
                                        Occurred Date
                                      </label>
                                      <input
                                        className="form-control"
                                        type="date"
                                        name="occurredAtUtc"
                                        value={editRiskEventForm.occurredAtUtc}
                                        onChange={handleEditRiskEventChange}
                                      />
                                    </div>
                                    <div className="col-12 col-md-4 d-flex align-items-end justify-content-end">
                                      <div className="task-row-actions">
                                        <button
                                          type="button"
                                          className="btn btn-success btn-sm"
                                          onClick={() =>
                                            handleUpdateRiskEvent(eventItem)
                                          }
                                        >
                                          <i className="bi bi-check-lg" />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() =>
                                            setEditingRiskEventId(null)
                                          }
                                        >
                                          <i className="bi bi-x-lg" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="risk-event-main">
                                      <strong>
                                        {eventItem.incidentDescription ||
                                          "Incident"}
                                      </strong>
                                      <div className="risk-event-meta">
                                        <span className="task-row-badge risk-event-status-badge">
                                          {RiskEventStatus[
                                            eventItem.status ?? 0
                                          ] || "Unknown"}
                                        </span>
                                        <span>
                                          Occurred:{" "}
                                          {formatDate(eventItem.occurredAtUtc)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="task-row-actions">
                                      <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() =>
                                          startEditRiskEvent(eventItem)
                                        }
                                      >
                                        <i className="bi bi-pencil" />
                                      </button>
                                      {confirmDeleteRiskEventId ===
                                      eventItem.id ? (
                                        <span className="confirm-inline confirm-inline-sm">
                                          <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() =>
                                              handleDeleteRiskEvent(
                                                eventItem.id,
                                                risk.id,
                                              )
                                            }
                                          >
                                            Yes
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() =>
                                              setConfirmDeleteRiskEventId(null)
                                            }
                                          >
                                            No
                                          </button>
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger btn-sm"
                                          onClick={() =>
                                            setConfirmDeleteRiskEventId(
                                              eventItem.id,
                                            )
                                          }
                                        >
                                          <i className="bi bi-trash" />
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
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
