import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import projectService, {
  type Project,
} from "../../services/projectManagementServices/projectService";
import taskService, {
  type Task,
} from "../../services/projectManagementServices/taskService";
import phaseService, {
  type Phase,
} from "../../services/projectManagementServices/phaseService";
import milestoneService, {
  type Milestone,
} from "../../services/projectManagementServices/milestoneService";
import milestoneApprovalService, {
  type MilestoneApproval,
} from "../../services/projectManagementServices/milestoneApprovalService";
import hrService, {
  type Employee,
} from "../../services/hrProjectManagementService";
import memberService, {
  type ProjectMember,
} from "../../services/projectManagementServices/memberService";

import financeService, {
  type Budget,
  type BudgetCreateDTO,
} from "../../services/projectManagementServices/financeService";

import {
  resourceRequestService,
  resourceService,
  type ResourceRequest,
  type Resource,
  type ResourceRequestCreateDTO,
} from "../../services/projectManagementServices/resourceService";
import riskService, {
  type Risk,
  type RiskEvent,
} from "../../services/projectManagementServices/riskService";
import {
  ProjectStage,
  HealthStatus,
  MethodologyType,
  BudgetCategory,
} from "../../config/enums";
import { PM_PERMISSION_KEYS } from "../../config/projectManagementPermissions";
import { useProjectManagementPermissions } from "../../hooks/useProjectManagementPermissions";
import type { RootState } from "../../store/store";
import { extractApiErrorMessage } from "../../utils/apiError";
import {
  formatDateOnly,
  toDateInputValue,
  toUtcDateOnly,
} from "../../utils/dateOnly";
import {
  ProjectFinanceTab,
  ProjectOverviewTab,
  ProjectPhasesTab,
  ProjectResourcesTab,
  ProjectRisksTab,
  ProjectTeamTab,
} from "./projectDetailsTabs";
import ".././styles/ProjectDetails.css";
import ".././styles/TaskDetails.css";

function formatDate(value?: string | null) {
  return formatDateOnly(value);
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
  const { canAny } = useProjectManagementPermissions();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] =
    useState<EditProjectFormState>(initialEditForm);
  const [activeTab, setActiveTab] = useState<ProjectDetailsTab>("overview");

  const canEditProject = canAny([...PM_PERMISSION_KEYS.PROJECTS.EDIT]);
  const canDeleteProject = canAny([...PM_PERMISSION_KEYS.PROJECTS.DELETE]);
  const canViewTeamMembers = canAny([...PM_PERMISSION_KEYS.ADMIN.MEMBERS.VIEW]);
  const canCreateTeamMembers = canAny([
    ...PM_PERMISSION_KEYS.ADMIN.MEMBERS.CREATE,
  ]);
  const canEditTeamMembers = canAny([...PM_PERMISSION_KEYS.ADMIN.MEMBERS.EDIT]);
  const canDeleteTeamMembers = canAny([
    ...PM_PERMISSION_KEYS.ADMIN.MEMBERS.DELETE,
  ]);
  const canAccessTeamTab = canAny([
    ...PM_PERMISSION_KEYS.ADMIN.MEMBERS.VIEW,
    ...PM_PERMISSION_KEYS.ADMIN.MEMBERS.CREATE,
    ...PM_PERMISSION_KEYS.ADMIN.MEMBERS.EDIT,
    ...PM_PERMISSION_KEYS.ADMIN.MEMBERS.DELETE,
  ]);
  const canAccessDocumentsWorkspace = canAny([
    ...PM_PERMISSION_KEYS.DOCUMENTS.VIEW,
    ...PM_PERMISSION_KEYS.DOCUMENTS.CREATE,
    ...PM_PERMISSION_KEYS.DOCUMENTS.EDIT,
    ...PM_PERMISSION_KEYS.DOCUMENTS.DELETE,
  ]);

  const canViewPhases = canAny([...PM_PERMISSION_KEYS.ADMIN.PHASES.VIEW]);
  const canCreatePhases = canAny([...PM_PERMISSION_KEYS.ADMIN.PHASES.CREATE]);
  const canEditPhases = canAny([...PM_PERMISSION_KEYS.ADMIN.PHASES.EDIT]);
  const canDeletePhases = canAny([...PM_PERMISSION_KEYS.ADMIN.PHASES.DELETE]);

  const canViewMilestones = canAny([...PM_PERMISSION_KEYS.MILESTONES.VIEW]);
  const canCreateMilestones = canAny([...PM_PERMISSION_KEYS.MILESTONES.CREATE]);
  const canEditMilestones = canAny([...PM_PERMISSION_KEYS.MILESTONES.EDIT]);
  const canDeleteMilestones = canAny([...PM_PERMISSION_KEYS.MILESTONES.DELETE]);

  const canViewTasks = canAny([...PM_PERMISSION_KEYS.TASKS.VIEW]);
  const canCreateTasks = canAny([...PM_PERMISSION_KEYS.TASKS.CREATE]);
  const canDeleteTasks = canAny([...PM_PERMISSION_KEYS.TASKS.DELETE]);

  const canViewMilestoneApprovals = canAny([
    ...PM_PERMISSION_KEYS.MILESTONES.APPROVALS.VIEW,
  ]);
  const canCreateMilestoneApprovals = canAny([
    ...PM_PERMISSION_KEYS.MILESTONES.APPROVALS.CREATE,
  ]);
  const canEditMilestoneApprovals = canAny([
    ...PM_PERMISSION_KEYS.MILESTONES.APPROVALS.EDIT,
  ]);
  const canDeleteMilestoneApprovals = canAny([
    ...PM_PERMISSION_KEYS.MILESTONES.APPROVALS.DELETE,
  ]);

  const canAccessPhasesTab = canAny([
    ...PM_PERMISSION_KEYS.ADMIN.PHASES.VIEW,
    ...PM_PERMISSION_KEYS.ADMIN.PHASES.CREATE,
    ...PM_PERMISSION_KEYS.ADMIN.PHASES.EDIT,
    ...PM_PERMISSION_KEYS.ADMIN.PHASES.DELETE,
    ...PM_PERMISSION_KEYS.MILESTONES.VIEW,
    ...PM_PERMISSION_KEYS.MILESTONES.CREATE,
    ...PM_PERMISSION_KEYS.MILESTONES.EDIT,
    ...PM_PERMISSION_KEYS.MILESTONES.DELETE,
    ...PM_PERMISSION_KEYS.TASKS.VIEW,
    ...PM_PERMISSION_KEYS.TASKS.CREATE,
    ...PM_PERMISSION_KEYS.TASKS.EDIT,
    ...PM_PERMISSION_KEYS.TASKS.DELETE,
    ...PM_PERMISSION_KEYS.MILESTONES.APPROVALS.VIEW,
    ...PM_PERMISSION_KEYS.MILESTONES.APPROVALS.CREATE,
    ...PM_PERMISSION_KEYS.MILESTONES.APPROVALS.EDIT,
    ...PM_PERMISSION_KEYS.MILESTONES.APPROVALS.DELETE,
  ]);

  const canViewResources = canAny([...PM_PERMISSION_KEYS.RESOURCES.VIEW]);
  const canCreateResources = canAny([...PM_PERMISSION_KEYS.RESOURCES.CREATE]);
  const canEditResources = canAny([...PM_PERMISSION_KEYS.RESOURCES.EDIT]);
  const canDeleteResources = canAny([...PM_PERMISSION_KEYS.RESOURCES.DELETE]);

  const canViewResourceRequests = canAny([
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.VIEW,
  ]);
  const canCreateResourceRequests = canAny([
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.CREATE,
  ]);
  const canEditResourceRequests = canAny([
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.EDIT,
  ]);
  const canDeleteResourceRequests = canAny([
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.DELETE,
  ]);

  const canAccessResourcesTab =
    canViewResources ||
    canCreateResources ||
    canEditResources ||
    canDeleteResources ||
    canViewResourceRequests ||
    canCreateResourceRequests ||
    canEditResourceRequests ||
    canDeleteResourceRequests;

  const canViewBudgets = canAny([...PM_PERMISSION_KEYS.FINANCE.BUDGETS.VIEW]);
  const canCreateBudgets = canAny([
    ...PM_PERMISSION_KEYS.FINANCE.BUDGETS.CREATE,
  ]);
  const canEditBudgets = canAny([...PM_PERMISSION_KEYS.FINANCE.BUDGETS.EDIT]);
  const canDeleteBudgets = canAny([
    ...PM_PERMISSION_KEYS.FINANCE.BUDGETS.DELETE,
  ]);

  const canAccessFinanceTab =
    canViewBudgets || canCreateBudgets || canEditBudgets || canDeleteBudgets;

  const canViewRisks = canAny([...PM_PERMISSION_KEYS.RISKS.VIEW]);
  const canCreateRisks = canAny([...PM_PERMISSION_KEYS.RISKS.CREATE]);
  const canEditRisks = canAny([...PM_PERMISSION_KEYS.RISKS.EDIT]);
  const canDeleteRisks = canAny([...PM_PERMISSION_KEYS.RISKS.DELETE]);

  const canViewRiskEvents = canAny([...PM_PERMISSION_KEYS.RISKS.EVENTS.VIEW]);
  const canCreateRiskEvents = canAny([
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.CREATE,
  ]);
  const canEditRiskEvents = canAny([...PM_PERMISSION_KEYS.RISKS.EVENTS.EDIT]);
  const canDeleteRiskEvents = canAny([
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.DELETE,
  ]);

  const canAccessRiskEvents = canAny([
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.VIEW,
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.CREATE,
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.EDIT,
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.DELETE,
  ]);

  const canAccessRisksTab = canAny([
    ...PM_PERMISSION_KEYS.RISKS.VIEW,
    ...PM_PERMISSION_KEYS.RISKS.CREATE,
    ...PM_PERMISSION_KEYS.RISKS.EDIT,
    ...PM_PERMISSION_KEYS.RISKS.DELETE,
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.VIEW,
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.CREATE,
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.EDIT,
    ...PM_PERMISSION_KEYS.RISKS.EVENTS.DELETE,
  ]);

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
        toast.error(
          extractApiErrorMessage(error, "Failed to load project details."),
        );
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

  useEffect(() => {
    if (activeTab === "team" && !canAccessTeamTab) {
      setActiveTab("overview");
    }
  }, [activeTab, canAccessTeamTab]);

  useEffect(() => {
    if (activeTab === "phases" && !canAccessPhasesTab) {
      setActiveTab("overview");
    }
  }, [activeTab, canAccessPhasesTab]);

  useEffect(() => {
    if (activeTab === "risks" && !canAccessRisksTab) {
      setActiveTab("overview");
    }
  }, [activeTab, canAccessRisksTab]);

  useEffect(() => {
    if (activeTab === "resources" && !canAccessResourcesTab) {
      setActiveTab("overview");
    }
  }, [activeTab, canAccessResourcesTab]);

  useEffect(() => {
    if (activeTab === "finance" && !canAccessFinanceTab) {
      setActiveTab("overview");
    }
  }, [activeTab, canAccessFinanceTab]);

  useEffect(() => {
    if (!canEditProject && isEditing) {
      setIsEditing(false);
    }
  }, [canEditProject, isEditing]);

  useEffect(() => {
    if (!canDeleteProject && confirmDeleteProject) {
      setConfirmDeleteProject(false);
    }
  }, [canDeleteProject, confirmDeleteProject]);

  useEffect(() => {
    if (!canCreateTeamMembers && showAddMember) {
      setShowAddMember(false);
    }
  }, [canCreateTeamMembers, showAddMember]);

  useEffect(() => {
    if (!canCreatePhases && showCreatePhase) {
      setShowCreatePhase(false);
    }
    if (!canCreateMilestones && showCreateMilestone) {
      setShowCreateMilestone(false);
    }
    if (!canCreateTasks && showCreateTask) {
      setShowCreateTask(false);
    }
    if (!canCreateMilestoneApprovals && showCreateApproval) {
      setShowCreateApproval(false);
    }
    if (!canCreateRisks && showCreateRisk) {
      setShowCreateRisk(false);
    }
    if (!canCreateRiskEvents && showCreateEventForRiskId) {
      setShowCreateEventForRiskId(null);
    }
    if (!canCreateResourceRequests && showCreateResourceReq) {
      setShowCreateResourceReq(false);
    }
    if (!canCreateBudgets && showCreateBudget) {
      setShowCreateBudget(false);
    }
  }, [
    canCreateBudgets,
    canCreateRiskEvents,
    canCreateRisks,
    canCreateResourceRequests,
    canCreateMilestoneApprovals,
    canCreateMilestones,
    canCreatePhases,
    canCreateTasks,
    showCreateEventForRiskId,
    showCreateApproval,
    showCreateMilestone,
    showCreatePhase,
    showCreateBudget,
    showCreateResourceReq,
    showCreateRisk,
    showCreateTask,
  ]);

  useEffect(() => {
    if (!canEditRisks && editingRiskId) {
      setEditingRiskId(null);
    }

    if (!canDeleteRisks && confirmDeleteRiskId) {
      setConfirmDeleteRiskId(null);
    }

    if (!canEditRiskEvents && editingRiskEventId) {
      setEditingRiskEventId(null);
    }

    if (!canDeleteRiskEvents && confirmDeleteRiskEventId) {
      setConfirmDeleteRiskEventId(null);
    }

    if (!canAccessRiskEvents && expandedRiskId) {
      setExpandedRiskId(null);
      setShowCreateEventForRiskId(null);
    }

    if (!canDeleteResourceRequests && confirmDeleteReqId) {
      setConfirmDeleteReqId(null);
    }

    if (!canEditBudgets && editingBudgetId) {
      setEditingBudgetId(null);
    }

    if (!canDeleteBudgets && confirmDeleteBudgetId) {
      setConfirmDeleteBudgetId(null);
    }
  }, [
    canAccessRiskEvents,
    canDeleteBudgets,
    canDeleteResourceRequests,
    canDeleteRiskEvents,
    canDeleteRisks,
    canEditRiskEvents,
    canEditRisks,
    canEditBudgets,
    confirmDeleteBudgetId,
    confirmDeleteRiskEventId,
    confirmDeleteRiskId,
    confirmDeleteReqId,
    editingBudgetId,
    editingRiskEventId,
    editingRiskId,
    expandedRiskId,
  ]);

  useEffect(() => {
    if (!canViewPhases) {
      setPhases([]);
      setSelectedPhaseId(null);
    }

    if (!canViewMilestones) {
      setMilestones([]);
      setSelectedMilestoneId(null);
    }

    if (!canViewTasks) {
      setTasks([]);
    }

    if (!canViewMilestoneApprovals) {
      setMilestoneApprovals([]);
    }

    if (!canViewRisks) {
      setRisks([]);
      setExpandedRiskId(null);
      setShowCreateRisk(false);
      setEditingRiskId(null);
      setConfirmDeleteRiskId(null);
      setRiskEventsByRisk({});
      setRisksLoaded(false);
    }

    if (!canViewRiskEvents) {
      setRiskEventsByRisk({});
      setShowCreateEventForRiskId(null);
      setEditingRiskEventId(null);
      setConfirmDeleteRiskEventId(null);
    }

    if (!canViewResourceRequests) {
      setResourceRequests([]);
      setResourceRequestsLoaded(false);
      setConfirmDeleteReqId(null);
    }

    if (!canViewResources) {
      setAllResources([]);
      setNewResourceReq((prev) => ({ ...prev, resourceId: "" }));
    }

    if (!canViewBudgets) {
      setBudgets([]);
      setBudgetsLoaded(false);
      setShowCreateBudget(false);
      setEditingBudgetId(null);
      setConfirmDeleteBudgetId(null);
    }
  }, [
    canViewBudgets,
    canViewResourceRequests,
    canViewResources,
    canViewMilestoneApprovals,
    canViewMilestones,
    canViewPhases,
    canViewRiskEvents,
    canViewRisks,
    canViewTasks,
  ]);

  // ── Fetch phases ──
  useEffect(() => {
    async function fetchPhases() {
      if (
        !projectId ||
        activeTab !== "phases" ||
        phasesLoaded ||
        !canViewPhases
      )
        return;
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
  }, [projectId, activeTab, phasesLoaded, canViewPhases]);

  // ── Fetch milestones for selected phase ──
  useEffect(() => {
    async function fetchMilestones() {
      if (!projectId || activeTab !== "phases" || !canViewMilestones) return;

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
  }, [projectId, activeTab, selectedPhaseId, canViewMilestones]);

  // ── Fetch tasks for selected milestone ──
  useEffect(() => {
    async function fetchTasks() {
      if (!projectId || activeTab !== "phases" || !canViewTasks) return;

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
  }, [projectId, activeTab, selectedMilestoneId, canViewTasks]);

  // ── Fetch approvals for selected milestone ──
  useEffect(() => {
    async function fetchMilestoneApprovals() {
      if (!activeTab || activeTab !== "phases" || !canViewMilestoneApprovals) {
        setMilestoneApprovals([]);
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
        toast.error(
          extractApiErrorMessage(error, "Failed to load milestone approvals."),
        );
      } finally {
        setApprovalsLoading(false);
      }
    }

    fetchMilestoneApprovals();
  }, [activeTab, selectedMilestoneId, canViewMilestoneApprovals]);

  // ── Fetch tasks for all milestones in selected phase (visual summary) ──
  useEffect(() => {
    async function fetchPhaseVisualTasks() {
      if (
        !projectId ||
        activeTab !== "phases" ||
        !selectedPhaseId ||
        !canViewPhases ||
        !canViewMilestones ||
        !canViewTasks
      ) {
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
  }, [
    projectId,
    activeTab,
    selectedPhaseId,
    milestones,
    canViewPhases,
    canViewMilestones,
    canViewTasks,
  ]);

  // ── Fetch resource requests ──
  useEffect(() => {
    async function fetchResourceRequests() {
      if (!projectId || activeTab !== "resources" || resourceRequestsLoaded)
        return;
      try {
        setResourceRequestsLoading(true);
        const [reqData, resData] = await Promise.all([
          canViewResourceRequests
            ? resourceRequestService.getAll(projectId)
            : Promise.resolve([]),
          canViewResources ? resourceService.getAll() : Promise.resolve([]),
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
  }, [
    projectId,
    activeTab,
    resourceRequestsLoaded,
    canViewResourceRequests,
    canViewResources,
  ]);

  // ── Fetch budgets ──
  useEffect(() => {
    async function fetchBudgets() {
      if (
        !projectId ||
        activeTab !== "finance" ||
        budgetsLoaded ||
        !canViewBudgets
      )
        return;
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
  }, [projectId, activeTab, budgetsLoaded, canViewBudgets]);

  // ── Fetch risks ──
  useEffect(() => {
    async function fetchRisks() {
      if (!projectId || activeTab !== "risks" || risksLoaded || !canViewRisks)
        return;

      try {
        setRisksLoading(true);
        const data = await riskService.getRisks(projectId);
        setRisks(data);
        setRisksLoaded(true);
      } catch (error) {
        console.error(error);
        toast.error(extractApiErrorMessage(error, "Failed to load risks."));
      } finally {
        setRisksLoading(false);
      }
    }

    fetchRisks();
  }, [projectId, activeTab, risksLoaded, canViewRisks]);

  async function refreshRisks() {
    if (!projectId) return;
    if (!canViewRisks) {
      setRisks([]);
      return;
    }
    try {
      setRisksLoading(true);
      const data = await riskService.getRisks(projectId);
      setRisks(data);
      setRisksLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(extractApiErrorMessage(error, "Failed to refresh risks."));
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
    if (!canViewRiskEvents) {
      setRiskEventsByRisk((prev) => ({ ...prev, [riskId]: [] }));
      return;
    }

    if (!force && riskEventsByRisk[riskId]) return;

    try {
      setRiskEventsLoadingByRisk((prev) => ({ ...prev, [riskId]: true }));
      const data = await riskService.getRiskEvents(riskId);
      setRiskEventsByRisk((prev) => ({ ...prev, [riskId]: data }));
    } catch (error) {
      console.error(error);
      toast.error(extractApiErrorMessage(error, "Failed to load risk events."));
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

    if (!canCreateRisks) {
      toast.error("You do not have permission to create risks.");
      return;
    }

    if (!newRisk.description.trim()) {
      toast.error("Risk description is required.");
      return;
    }

    if (!currentUserId) {
      toast.error("Unable to detect the logged-in user.");
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
        ownerId: currentUserId,
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
      toast.error(extractApiErrorMessage(error, "Failed to create risk."));
    } finally {
      setCreatingRisk(false);
    }
  }

  function startEditRisk(risk: Risk) {
    if (!canEditRisks) {
      toast.error("You do not have permission to edit risks.");
      return;
    }

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

    if (!canEditRisks) {
      toast.error("You do not have permission to edit risks.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to update risk."));
    }
  }

  async function handleDeleteRisk(riskId: string) {
    if (!canDeleteRisks) {
      toast.error("You do not have permission to delete risks.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to delete risk."));
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

    if (!canCreateRiskEvents) {
      toast.error("You do not have permission to create risk events.");
      return;
    }

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
      toast.error(
        extractApiErrorMessage(error, "Failed to create risk event."),
      );
    } finally {
      setCreatingRiskEvent(false);
    }
  }

  function startEditRiskEvent(eventItem: RiskEvent) {
    if (!canEditRiskEvents) {
      toast.error("You do not have permission to edit risk events.");
      return;
    }

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

    if (!canEditRiskEvents) {
      toast.error("You do not have permission to edit risk events.");
      return;
    }

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
      toast.error(
        extractApiErrorMessage(error, "Failed to update risk event."),
      );
    }
  }

  async function handleDeleteRiskEvent(eventId: string, riskId: string) {
    if (!canDeleteRiskEvents) {
      toast.error("You do not have permission to delete risk events.");
      return;
    }

    try {
      await riskService.deleteRiskEventById(eventId);
      toast.success("Risk event deleted.");
      await loadRiskEvents(riskId, true);
    } catch (error) {
      console.error(error);
      toast.error(
        extractApiErrorMessage(error, "Failed to delete risk event."),
      );
    } finally {
      setConfirmDeleteRiskEventId(null);
    }
  }

  // ── Fetch employees (for adding to project) ──
  useEffect(() => {
    async function fetchEmployees() {
      const shouldLoadEmployeesForTab =
        activeTab === "phases" || (activeTab === "team" && canAccessTeamTab);

      if (!shouldLoadEmployeesForTab || employeesLoaded) {
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
  }, [activeTab, canAccessTeamTab, employeesLoaded]);

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
    if (
      ((activeTab === "team" && canAccessTeamTab) || activeTab === "phases") &&
      !membersLoaded
    ) {
      refreshMembers();
    }
  }, [projectId, activeTab, canAccessTeamTab, membersLoaded]);

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
    if (!canCreateTeamMembers) {
      toast.error("You do not have permission to add team members.");
      return;
    }

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
          extractApiErrorMessage(
            error,
            "Backend constraint is blocking additional members for this project (409).",
          ),
        );
      } else {
        toast.error(extractApiErrorMessage(error, "Failed to add member."));
      }
    } finally {
      setAddingMember(false);
    }
  }

  async function handleUpdateMemberRole(member: ProjectMember) {
    if (!canEditTeamMembers) {
      toast.error("You do not have permission to edit team members.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to update member."));
    }
  }

  async function handleDeleteMember(member: ProjectMember) {
    if (!canDeleteTeamMembers) {
      toast.error("You do not have permission to remove team members.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to remove member."));
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

    if (!canEditProject) {
      toast.error("You do not have permission to edit this project.");
      return;
    }

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
        startDateUtc: toUtcDateOnly(editForm.startDateUtc),
        endDateUtc: toUtcDateOnly(editForm.endDateUtc),
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
      toast.error(extractApiErrorMessage(error, "Failed to update project."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject() {
    if (!canDeleteProject) {
      toast.error("You do not have permission to delete this project.");
      return;
    }

    if (!projectId || !project) return;
    try {
      setSaving(true);
      await projectService.deleteProjectById(projectId);
      toast.success("Project deleted successfully.");
      navigate("/dashboard/portfolios");
    } catch (error) {
      console.error(error);
      toast.error(extractApiErrorMessage(error, "Failed to delete project."));
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

    if (!canCreateTasks) {
      toast.error("You do not have permission to create tasks.");
      return;
    }

    if (!projectId) return;
    if (!selectedMilestoneId) {
      toast.error("Select a milestone before creating a task.");
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

      await taskService.createTask({
        projectId,
        milestoneId: selectedMilestoneId,
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        priority: safeInt(newTask.priority, 1),
        status: safeInt(newTask.status),
        startDateUtc: toUtcDateOnly(newTask.startDateUtc),
        dueDateUtc: toUtcDateOnly(newTask.dueDateUtc),
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
      toast.error(extractApiErrorMessage(error, "Failed to create task."));
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!canDeleteTasks) {
      toast.error("You do not have permission to delete tasks.");
      return;
    }

    try {
      await taskService.deleteTaskById(taskId);
      toast.success("Task deleted.");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error(error);
      toast.error(extractApiErrorMessage(error, "Failed to delete task."));
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

    if (!canCreatePhases) {
      toast.error("You do not have permission to create phases.");
      return;
    }

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
        startDateUtc: toUtcDateOnly(newPhase.startDateUtc),
        endDateUtc: toUtcDateOnly(newPhase.endDateUtc),
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
      toast.error(extractApiErrorMessage(error, "Failed to create phase."));
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
    if (!canEditPhases) {
      toast.error("You do not have permission to edit phases.");
      return;
    }

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
        startDateUtc: toUtcDateOnly(editPhaseForm.startDateUtc),
        endDateUtc: toUtcDateOnly(editPhaseForm.endDateUtc),
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
      toast.error(extractApiErrorMessage(error, "Failed to update phase."));
    }
  }

  async function handleDeletePhase(phaseId: string) {
    if (!canDeletePhases) {
      toast.error("You do not have permission to delete phases.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to delete phase."));
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

    if (!canCreateMilestones) {
      toast.error("You do not have permission to create milestones.");
      return;
    }

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
        targetDateUtc: toUtcDateOnly(newMilestone.targetDateUtc),
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
      toast.error(extractApiErrorMessage(error, "Failed to create milestone."));
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
    if (!canEditMilestones) {
      toast.error("You do not have permission to edit milestones.");
      return;
    }

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
        targetDateUtc: toUtcDateOnly(editMilestoneForm.targetDateUtc),
        actualDateUtc: toUtcDateOnly(editMilestoneForm.actualDateUtc),
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
      toast.error(extractApiErrorMessage(error, "Failed to update milestone."));
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    if (!canDeleteMilestones) {
      toast.error("You do not have permission to delete milestones.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to delete milestone."));
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
    if (!canViewMilestoneApprovals) {
      setMilestoneApprovals([]);
      return;
    }

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
    if (!canCreateMilestoneApprovals) {
      toast.error("You do not have permission to create milestone approvals.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to add approval."));
    } finally {
      setCreatingApproval(false);
    }
  }

  async function handleUpdateApproval(approval: MilestoneApproval) {
    if (!canEditMilestoneApprovals) {
      toast.error("You do not have permission to edit milestone approvals.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to update approval."));
    }
  }

  async function handleDeleteApproval(approvalId: string) {
    if (!canDeleteMilestoneApprovals) {
      toast.error("You do not have permission to delete milestone approvals.");
      return;
    }

    try {
      await milestoneApprovalService.deleteApprovalById(approvalId);
      toast.success("Approval deleted.");
      setMilestoneApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    } catch (error) {
      console.error(error);
      toast.error(extractApiErrorMessage(error, "Failed to delete approval."));
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

    if (!canCreateResourceRequests) {
      toast.error("You do not have permission to create resource requests.");
      return;
    }

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
      if (canViewResourceRequests) {
        const data = await resourceRequestService.getAll(projectId);
        setResourceRequests(data);
      }
      setResourceRequestsLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(
        extractApiErrorMessage(error, "Failed to create resource request."),
      );
    } finally {
      setCreatingResourceReq(false);
    }
  }

  async function handleDeleteResourceReq(id: string) {
    if (!canDeleteResourceRequests) {
      toast.error("You do not have permission to delete resource requests.");
      return;
    }

    try {
      await resourceRequestService.delete(id);
      toast.success("Resource request deleted.");
      setResourceRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
      toast.error(
        extractApiErrorMessage(error, "Failed to delete resource request."),
      );
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
    if (!canAccessDocumentsWorkspace) {
      toast.error("You do not have permission to access documents workspace.");
      return;
    }

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

    if (!canCreateBudgets) {
      toast.error("You do not have permission to create budgets.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to create budget."));
    } finally {
      setCreatingBudget(false);
    }
  }

  function startEditBudget(budget: Budget) {
    if (!canEditBudgets) {
      toast.error("You do not have permission to edit budgets.");
      return;
    }

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

    if (!canEditBudgets) {
      toast.error("You do not have permission to edit budgets.");
      return;
    }

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
      toast.error(extractApiErrorMessage(error, "Failed to update budget."));
    }
  }

  async function handleDeleteBudget(budgetId: string) {
    if (!canDeleteBudgets) {
      toast.error("You do not have permission to delete budgets.");
      return;
    }

    try {
      await financeService.deleteBudgetById(budgetId);
      toast.success("Budget deleted.");
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    } catch (error) {
      console.error(error);
      toast.error(extractApiErrorMessage(error, "Failed to delete budget."));
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
          {canEditProject && (
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
          )}
          {canDeleteProject &&
            (confirmDeleteProject ? (
              <span className="confirm-inline">
                <span className="confirm-inline-text">
                  Delete this project?
                </span>
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
            ))}
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
        {canAccessTeamTab && (
          <button
            type="button"
            className={`project-tab-btn ${activeTab === "team" ? "active" : ""}`}
            onClick={() => setActiveTab("team")}
          >
            <i className="bi bi-people me-2" />
            Team
          </button>
        )}
        {canAccessPhasesTab && (
          <button
            type="button"
            className={`project-tab-btn ${activeTab === "phases" ? "active" : ""}`}
            onClick={() => setActiveTab("phases")}
          >
            <i className="bi bi-layers me-2" />
            Phases
          </button>
        )}
        {canAccessRisksTab && (
          <button
            type="button"
            className={`project-tab-btn ${activeTab === "risks" ? "active" : ""}`}
            onClick={() => setActiveTab("risks")}
          >
            <i className="bi bi-shield-exclamation me-2" />
            Risks
          </button>
        )}
        {canAccessResourcesTab && (
          <button
            type="button"
            className={`project-tab-btn ${activeTab === "resources" ? "active" : ""}`}
            onClick={() => setActiveTab("resources")}
          >
            <i className="bi bi-box-seam me-2" />
            Resources
          </button>
        )}
        {canAccessFinanceTab && (
          <button
            type="button"
            className={`project-tab-btn ${activeTab === "finance" ? "active" : ""}`}
            onClick={() => setActiveTab("finance")}
          >
            <i className="bi bi-cash-coin me-2" />
            Finance
          </button>
        )}
      </section>

      {canEditProject && isEditing && (
        <section className="details-card mb-4">
          <form className="row g-3" onSubmit={handleUpdateProject}>
            <div className="col-12 col-lg-12">
              <label className="form-label">Project Name</label>
              <input
                className="form-control"
                name="name"
                value={editForm.name}
                onChange={handleEditInputChange}
                required
              />
            </div>
            {/* <div className="col-12 col-lg-6">
              <label className="form-label">Portfolio ID</label>
              <input
                className="form-control"
                name="portfolioId"
                value={editForm.portfolioId}
                onChange={handleEditInputChange}
              />
            </div> */}
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
        <ProjectOverviewTab
          project={project}
          canAccessDocumentsWorkspace={canAccessDocumentsWorkspace}
          openDocumentsWorkspace={openDocumentsWorkspace}
          formatDate={formatDate}
        />
      )}

      {activeTab === "team" && canAccessTeamTab && (
        <ProjectTeamTab
          canCreateTeamMembers={canCreateTeamMembers}
          showAddMember={showAddMember}
          setShowAddMember={setShowAddMember}
          employeeSearch={employeeSearch}
          setEmployeeSearch={setEmployeeSearch}
          filteredAvailableEmployees={filteredAvailableEmployees}
          addingMember={addingMember}
          handleAddMemberFromEmployee={handleAddMemberFromEmployee}
          canViewTeamMembers={canViewTeamMembers}
          membersLoading={membersLoading}
          projectMembers={projectMembers}
          employees={employees}
          resolveEmployeeUserId={resolveEmployeeUserId}
          canEditTeamMembers={canEditTeamMembers}
          canDeleteTeamMembers={canDeleteTeamMembers}
          setEditingMemberId={setEditingMemberId}
          setEditMemberRole={setEditMemberRole}
          handleDeleteMember={handleDeleteMember}
          editingMemberId={editingMemberId}
          editMemberRole={editMemberRole}
          handleUpdateMemberRole={handleUpdateMemberRole}
        />
      )}

      {activeTab === "phases" && canAccessPhasesTab && (
        <ProjectPhasesTab
          selectedPhaseId={selectedPhaseId}
          setSelectedPhaseId={setSelectedPhaseId}
          selectedMilestoneId={selectedMilestoneId}
          setSelectedMilestoneId={setSelectedMilestoneId}
          setTasks={setTasks}
          canCreatePhases={canCreatePhases}
          showCreatePhase={showCreatePhase}
          setShowCreatePhase={setShowCreatePhase}
          handleCreatePhase={handleCreatePhase}
          newPhase={newPhase}
          handleNewPhaseChange={handleNewPhaseChange}
          creatingPhase={creatingPhase}
          canViewPhases={canViewPhases}
          phasesLoading={phasesLoading}
          phases={phases}
          editingPhaseId={editingPhaseId}
          canEditPhases={canEditPhases}
          editPhaseForm={editPhaseForm}
          handleEditPhaseChange={handleEditPhaseChange}
          handleUpdatePhase={handleUpdatePhase}
          setEditingPhaseId={setEditingPhaseId}
          canDeletePhases={canDeletePhases}
          confirmDeletePhaseId={confirmDeletePhaseId}
          handleDeletePhase={handleDeletePhase}
          setConfirmDeletePhaseId={setConfirmDeletePhaseId}
          startEditPhase={startEditPhase}
          canCreateMilestones={canCreateMilestones}
          showCreateMilestone={showCreateMilestone}
          setShowCreateMilestone={setShowCreateMilestone}
          canViewMilestones={canViewMilestones}
          handleCreateMilestone={handleCreateMilestone}
          newMilestone={newMilestone}
          handleNewMilestoneChange={handleNewMilestoneChange}
          creatingMilestone={creatingMilestone}
          milestonesLoading={milestonesLoading}
          milestones={milestones}
          editingMilestoneId={editingMilestoneId}
          canEditMilestones={canEditMilestones}
          editMilestoneForm={editMilestoneForm}
          handleEditMilestoneChange={handleEditMilestoneChange}
          handleUpdateMilestone={handleUpdateMilestone}
          setEditingMilestoneId={setEditingMilestoneId}
          canDeleteMilestones={canDeleteMilestones}
          confirmDeleteMilestoneId={confirmDeleteMilestoneId}
          handleDeleteMilestone={handleDeleteMilestone}
          setConfirmDeleteMilestoneId={setConfirmDeleteMilestoneId}
          startEditMilestone={startEditMilestone}
          canCreateTasks={canCreateTasks}
          canViewTasks={canViewTasks}
          showCreateTask={showCreateTask}
          setShowCreateTask={setShowCreateTask}
          handleCreateTask={handleCreateTask}
          newTask={newTask}
          handleNewTaskChange={handleNewTaskChange}
          memberDropdownRef={memberDropdownRef}
          setShowMemberDropdown={setShowMemberDropdown}
          showMemberDropdown={showMemberDropdown}
          getMemberDisplayName={getMemberDisplayName}
          setNewTask={setNewTask}
          memberSearch={memberSearch}
          setMemberSearch={setMemberSearch}
          filteredMembers={filteredMembers}
          creatingTask={creatingTask}
          tasksLoading={tasksLoading}
          tasks={tasks}
          getTaskAssigneeInfo={getTaskAssigneeInfo}
          onOpenTask={(taskId) =>
            navigate(
              `/dashboard/portfolios/${portfolioId}/projects/${projectId}/tasks/${taskId}`,
            )
          }
          canDeleteTasks={canDeleteTasks}
          confirmDeleteTaskId={confirmDeleteTaskId}
          handleDeleteTask={handleDeleteTask}
          setConfirmDeleteTaskId={setConfirmDeleteTaskId}
          selectedPhase={selectedPhase}
          selectedMilestone={selectedMilestone}
          canCreateMilestoneApprovals={canCreateMilestoneApprovals}
          setShowCreateApproval={setShowCreateApproval}
          showCreateApproval={showCreateApproval}
          currentUserId={currentUserId}
          newApprovalForm={newApprovalForm}
          handleNewApprovalChange={handleNewApprovalChange}
          handleCreateApproval={handleCreateApproval}
          creatingApproval={creatingApproval}
          canViewMilestoneApprovals={canViewMilestoneApprovals}
          approvalsLoading={approvalsLoading}
          milestoneApprovals={milestoneApprovals}
          editingApprovalId={editingApprovalId}
          canEditMilestoneApprovals={canEditMilestoneApprovals}
          editApprovalForm={editApprovalForm}
          handleEditApprovalChange={handleEditApprovalChange}
          handleUpdateApproval={handleUpdateApproval}
          setEditingApprovalId={setEditingApprovalId}
          canDeleteMilestoneApprovals={canDeleteMilestoneApprovals}
          confirmDeleteApprovalId={confirmDeleteApprovalId}
          handleDeleteApproval={handleDeleteApproval}
          setConfirmDeleteApprovalId={setConfirmDeleteApprovalId}
          startEditApproval={startEditApproval}
          getApproverDisplayName={getApproverDisplayName}
          formatDate={formatDate}
          phaseVisualLoading={phaseVisualLoading}
          phaseVisualSummary={phaseVisualSummary}
          phaseMilestoneVisualRows={phaseMilestoneVisualRows}
          getTaskStatusColor={getTaskStatusColor}
        />
      )}

      {activeTab === "risks" && canAccessRisksTab && (
        <ProjectRisksTab
          canCreateRisks={canCreateRisks}
          showCreateRisk={showCreateRisk}
          setShowCreateRisk={setShowCreateRisk}
          canViewRisks={canViewRisks}
          riskSummaryData={riskSummaryData}
          canViewRiskEvents={canViewRiskEvents}
          riskEventsChartData={riskEventsChartData}
          riskSeverityFilter={riskSeverityFilter}
          setRiskSeverityFilter={setRiskSeverityFilter}
          riskSortBy={riskSortBy}
          setRiskSortBy={setRiskSortBy}
          handleCreateRisk={handleCreateRisk}
          newRisk={newRisk}
          handleNewRiskChange={handleNewRiskChange}
          creatingRisk={creatingRisk}
          risksLoading={risksLoading}
          displayedRisks={displayedRisks}
          expandedRiskId={expandedRiskId}
          riskEventsByRisk={riskEventsByRisk}
          riskEventsLoadingByRisk={riskEventsLoadingByRisk}
          getRiskSeverityBucket={getRiskSeverityBucket}
          getRiskSeverityColor={getRiskSeverityColor}
          getRiskSeverityLabel={getRiskSeverityLabel}
          editingRiskId={editingRiskId}
          canEditRisks={canEditRisks}
          startEditRisk={startEditRisk}
          editRiskForm={editRiskForm}
          handleEditRiskChange={handleEditRiskChange}
          handleUpdateRisk={handleUpdateRisk}
          setEditingRiskId={setEditingRiskId}
          canDeleteRisks={canDeleteRisks}
          confirmDeleteRiskId={confirmDeleteRiskId}
          handleDeleteRisk={handleDeleteRisk}
          setConfirmDeleteRiskId={setConfirmDeleteRiskId}
          canAccessRiskEvents={canAccessRiskEvents}
          handleToggleRiskExpansion={handleToggleRiskExpansion}
          canCreateRiskEvents={canCreateRiskEvents}
          setShowCreateEventForRiskId={setShowCreateEventForRiskId}
          showCreateEventForRiskId={showCreateEventForRiskId}
          newRiskEvent={newRiskEvent}
          handleNewRiskEventChange={handleNewRiskEventChange}
          handleCreateRiskEvent={handleCreateRiskEvent}
          creatingRiskEvent={creatingRiskEvent}
          editingRiskEventId={editingRiskEventId}
          canEditRiskEvents={canEditRiskEvents}
          editRiskEventForm={editRiskEventForm}
          handleEditRiskEventChange={handleEditRiskEventChange}
          handleUpdateRiskEvent={handleUpdateRiskEvent}
          setEditingRiskEventId={setEditingRiskEventId}
          canDeleteRiskEvents={canDeleteRiskEvents}
          confirmDeleteRiskEventId={confirmDeleteRiskEventId}
          handleDeleteRiskEvent={handleDeleteRiskEvent}
          setConfirmDeleteRiskEventId={setConfirmDeleteRiskEventId}
          startEditRiskEvent={startEditRiskEvent}
          formatDate={formatDate}
        />
      )}

      {activeTab === "resources" && canAccessResourcesTab && (
        <ProjectResourcesTab
          canCreateResourceRequests={canCreateResourceRequests}
          showCreateResourceReq={showCreateResourceReq}
          setShowCreateResourceReq={setShowCreateResourceReq}
          canViewResourceRequests={canViewResourceRequests}
          handleCreateResourceReq={handleCreateResourceReq}
          newResourceReq={newResourceReq}
          handleNewResourceReqChange={handleNewResourceReqChange}
          creatingResourceReq={creatingResourceReq}
          canViewResources={canViewResources}
          allResources={allResources}
          resourceRequestsLoading={resourceRequestsLoading}
          resourceRequests={resourceRequests}
          getResourceName={getResourceName}
          resourceTypeColor={resourceTypeColor}
          requestStatusColor={requestStatusColor}
          canDeleteResourceRequests={canDeleteResourceRequests}
          confirmDeleteReqId={confirmDeleteReqId}
          handleDeleteResourceReq={handleDeleteResourceReq}
          setConfirmDeleteReqId={setConfirmDeleteReqId}
        />
      )}

      {activeTab === "finance" && canAccessFinanceTab && (
        <ProjectFinanceTab
          canCreateBudgets={canCreateBudgets}
          showCreateBudget={showCreateBudget}
          setShowCreateBudget={setShowCreateBudget}
          availableBudgetCategoryEntries={availableBudgetCategoryEntries}
          canViewBudgets={canViewBudgets}
          handleCreateBudget={handleCreateBudget}
          newBudget={newBudget}
          handleNewBudgetChange={handleNewBudgetChange}
          creatingBudget={creatingBudget}
          budgetsLoading={budgetsLoading}
          budgets={budgets}
          budgetChartData={budgetChartData}
          budgetDistributionData={budgetDistributionData}
          chartPalette={chartPalette}
          currencyFormatter={currencyFormatter}
          budgetConsumptionData={budgetConsumptionData}
          editingBudgetId={editingBudgetId}
          canEditBudgets={canEditBudgets}
          editBudgetForm={editBudgetForm}
          handleEditBudgetChange={handleEditBudgetChange}
          handleUpdateBudget={handleUpdateBudget}
          setEditingBudgetId={setEditingBudgetId}
          canDeleteBudgets={canDeleteBudgets}
          confirmDeleteBudgetId={confirmDeleteBudgetId}
          handleDeleteBudget={handleDeleteBudget}
          setConfirmDeleteBudgetId={setConfirmDeleteBudgetId}
          startEditBudget={startEditBudget}
        />
      )}
    </div>
  );
}

export default ProjectDetails;
