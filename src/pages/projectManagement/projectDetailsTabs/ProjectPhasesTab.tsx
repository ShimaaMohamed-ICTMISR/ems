import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  RefObject,
  SetStateAction,
} from "react";
import { AccessDeniedState } from "../../../Components/AccessDeniedState";
import {
  ApprovalStatus,
  PriorityLevel,
  TaskStatus as TaskStatusEnum,
} from "../../../config/enums";
import type { MilestoneApproval } from "../../../services/projectManagementServices/milestoneApprovalService";
import type { Milestone } from "../../../services/projectManagementServices/milestoneService";
import type { Phase } from "../../../services/projectManagementServices/phaseService";
import type { ProjectMember } from "../../../services/projectManagementServices/memberService";
import type { Task } from "../../../services/projectManagementServices/taskService";

type PhaseFormState = {
  name: string;
  startDateUtc: string;
  endDateUtc: string;
  deliverables: string;
  isGatePassed: boolean;
};

type MilestoneFormState = {
  name: string;
  targetDateUtc: string;
  successCriteria: string;
  isCompleted: boolean;
};

type EditMilestoneFormState = {
  name: string;
  targetDateUtc: string;
  actualDateUtc: string;
  successCriteria: string;
  isCompleted: boolean;
};

type TaskFormState = {
  title: string;
  description: string;
  priority: string;
  status: string;
  startDateUtc: string;
  dueDateUtc: string;
  completionPercentage: string;
  effortEstimateHours: string;
  assignedToMemberId: string;
};

type ApprovalFormState = {
  status: string;
  comments: string;
  decidedAtUtc: string;
};

type TaskAssigneeInfo = {
  label: string;
  type: "hr" | "member" | null;
};

type PhaseVisualRow = {
  id: string;
  name: string;
  milestoneStatus: string;
  completionPercent: number;
  totalTasks: number;
  completedTasks: number;
  statusCounts: Record<number, number>;
};

type PhaseVisualSummary = {
  totalMilestones: number;
  completedMilestones: number;
  milestoneProgressPercent: number;
  taskTotals: {
    total: number;
    completed: number;
    statusCounts: Record<number, number>;
  };
  taskProgressPercent: number;
};

type ProjectPhasesTabProps = {
  selectedPhaseId: string | null;
  setSelectedPhaseId: Dispatch<SetStateAction<string | null>>;
  selectedMilestoneId: string | null;
  setSelectedMilestoneId: Dispatch<SetStateAction<string | null>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  canCreatePhases: boolean;
  showCreatePhase: boolean;
  setShowCreatePhase: Dispatch<SetStateAction<boolean>>;
  handleCreatePhase: (event: FormEvent<HTMLFormElement>) => void;
  newPhase: PhaseFormState;
  handleNewPhaseChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  creatingPhase: boolean;
  canViewPhases: boolean;
  phasesLoading: boolean;
  phases: Phase[];
  editingPhaseId: string | null;
  canEditPhases: boolean;
  editPhaseForm: PhaseFormState;
  handleEditPhaseChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleUpdatePhase: (phase: Phase) => void;
  setEditingPhaseId: Dispatch<SetStateAction<string | null>>;
  canDeletePhases: boolean;
  confirmDeletePhaseId: string | null;
  handleDeletePhase: (phaseId: string) => void;
  setConfirmDeletePhaseId: Dispatch<SetStateAction<string | null>>;
  startEditPhase: (phase: Phase) => void;
  canCreateMilestones: boolean;
  showCreateMilestone: boolean;
  setShowCreateMilestone: Dispatch<SetStateAction<boolean>>;
  canViewMilestones: boolean;
  handleCreateMilestone: (event: FormEvent<HTMLFormElement>) => void;
  newMilestone: MilestoneFormState;
  handleNewMilestoneChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  creatingMilestone: boolean;
  milestonesLoading: boolean;
  milestones: Milestone[];
  editingMilestoneId: string | null;
  canEditMilestones: boolean;
  editMilestoneForm: EditMilestoneFormState;
  handleEditMilestoneChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleUpdateMilestone: (milestone: Milestone) => void;
  setEditingMilestoneId: Dispatch<SetStateAction<string | null>>;
  canDeleteMilestones: boolean;
  confirmDeleteMilestoneId: string | null;
  handleDeleteMilestone: (milestoneId: string) => void;
  setConfirmDeleteMilestoneId: Dispatch<SetStateAction<string | null>>;
  startEditMilestone: (milestone: Milestone) => void;
  canCreateTasks: boolean;
  canViewTasks: boolean;
  showCreateTask: boolean;
  setShowCreateTask: Dispatch<SetStateAction<boolean>>;
  handleCreateTask: (event: FormEvent<HTMLFormElement>) => void;
  newTask: TaskFormState;
  handleNewTaskChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  memberDropdownRef: RefObject<HTMLDivElement | null>;
  setShowMemberDropdown: Dispatch<SetStateAction<boolean>>;
  showMemberDropdown: boolean;
  getMemberDisplayName: (memberId: string) => string;
  setNewTask: Dispatch<SetStateAction<TaskFormState>>;
  memberSearch: string;
  setMemberSearch: Dispatch<SetStateAction<string>>;
  filteredMembers: ProjectMember[];
  creatingTask: boolean;
  tasksLoading: boolean;
  tasks: Task[];
  getTaskAssigneeInfo: (task: Task) => TaskAssigneeInfo;
  onOpenTask: (taskId: string) => void;
  canDeleteTasks: boolean;
  confirmDeleteTaskId: string | null;
  handleDeleteTask: (taskId: string) => void;
  setConfirmDeleteTaskId: Dispatch<SetStateAction<string | null>>;
  selectedPhase: Phase | null;
  selectedMilestone: Milestone | null;
  canCreateMilestoneApprovals: boolean;
  setShowCreateApproval: Dispatch<SetStateAction<boolean>>;
  showCreateApproval: boolean;
  currentUserId: string;
  newApprovalForm: ApprovalFormState;
  handleNewApprovalChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleCreateApproval: () => void;
  creatingApproval: boolean;
  canViewMilestoneApprovals: boolean;
  approvalsLoading: boolean;
  milestoneApprovals: MilestoneApproval[];
  editingApprovalId: string | null;
  canEditMilestoneApprovals: boolean;
  editApprovalForm: ApprovalFormState;
  handleEditApprovalChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleUpdateApproval: (approval: MilestoneApproval) => void;
  setEditingApprovalId: Dispatch<SetStateAction<string | null>>;
  canDeleteMilestoneApprovals: boolean;
  confirmDeleteApprovalId: string | null;
  handleDeleteApproval: (approvalId: string) => void;
  setConfirmDeleteApprovalId: Dispatch<SetStateAction<string | null>>;
  startEditApproval: (approval: MilestoneApproval) => void;
  getApproverDisplayName: (approverId?: string | null) => string;
  formatDate: (value?: string | null) => string;
  phaseVisualLoading: boolean;
  phaseVisualSummary: PhaseVisualSummary;
  phaseMilestoneVisualRows: PhaseVisualRow[];
  getTaskStatusColor: (status: number) => string;
};

export function ProjectPhasesTab({
  selectedPhaseId,
  setSelectedPhaseId,
  selectedMilestoneId,
  setSelectedMilestoneId,
  setTasks,
  canCreatePhases,
  showCreatePhase,
  setShowCreatePhase,
  handleCreatePhase,
  newPhase,
  handleNewPhaseChange,
  creatingPhase,
  canViewPhases,
  phasesLoading,
  phases,
  editingPhaseId,
  canEditPhases,
  editPhaseForm,
  handleEditPhaseChange,
  handleUpdatePhase,
  setEditingPhaseId,
  canDeletePhases,
  confirmDeletePhaseId,
  handleDeletePhase,
  setConfirmDeletePhaseId,
  startEditPhase,
  canCreateMilestones,
  showCreateMilestone,
  setShowCreateMilestone,
  canViewMilestones,
  handleCreateMilestone,
  newMilestone,
  handleNewMilestoneChange,
  creatingMilestone,
  milestonesLoading,
  milestones,
  editingMilestoneId,
  canEditMilestones,
  editMilestoneForm,
  handleEditMilestoneChange,
  handleUpdateMilestone,
  setEditingMilestoneId,
  canDeleteMilestones,
  confirmDeleteMilestoneId,
  handleDeleteMilestone,
  setConfirmDeleteMilestoneId,
  startEditMilestone,
  canCreateTasks,
  canViewTasks,
  showCreateTask,
  setShowCreateTask,
  handleCreateTask,
  newTask,
  handleNewTaskChange,
  memberDropdownRef,
  setShowMemberDropdown,
  showMemberDropdown,
  getMemberDisplayName,
  setNewTask,
  memberSearch,
  setMemberSearch,
  filteredMembers,
  creatingTask,
  tasksLoading,
  tasks,
  getTaskAssigneeInfo,
  onOpenTask,
  canDeleteTasks,
  confirmDeleteTaskId,
  handleDeleteTask,
  setConfirmDeleteTaskId,
  selectedPhase,
  selectedMilestone,
  canCreateMilestoneApprovals,
  setShowCreateApproval,
  showCreateApproval,
  currentUserId,
  newApprovalForm,
  handleNewApprovalChange,
  handleCreateApproval,
  creatingApproval,
  canViewMilestoneApprovals,
  approvalsLoading,
  milestoneApprovals,
  editingApprovalId,
  canEditMilestoneApprovals,
  editApprovalForm,
  handleEditApprovalChange,
  handleUpdateApproval,
  setEditingApprovalId,
  canDeleteMilestoneApprovals,
  confirmDeleteApprovalId,
  handleDeleteApproval,
  setConfirmDeleteApprovalId,
  startEditApproval,
  getApproverDisplayName,
  formatDate,
  phaseVisualLoading,
  phaseVisualSummary,
  phaseMilestoneVisualRows,
  getTaskStatusColor,
}: ProjectPhasesTabProps) {
  return (
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
              {canCreatePhases && (
                <button
                  type="button"
                  className="btn btn-info text-white btn-sm"
                  onClick={() => setShowCreatePhase((prev) => !prev)}
                >
                  {showCreatePhase ? "Cancel" : "+ Add"}
                </button>
              )}
            </div>

            {canCreatePhases && showCreatePhase && (
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

            {!canViewPhases ? (
              <AccessDeniedState
                title="Phases are restricted"
                description="You do not have permission to view project phases."
              />
            ) : phasesLoading ? (
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
                    {editingPhaseId === p.id && canEditPhases ? (
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
                          <strong>Phase: {p.name || "Unnamed"}</strong>
                          <span>
                            Start:{" "}
                            {p.startDateUtc
                              ? new Date(p.startDateUtc).toLocaleDateString()
                              : "No start date"}
                          </span>
                        </button>
                        <div className="task-row-actions">
                          {canDeletePhases && confirmDeletePhaseId === p.id ? (
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
                                onClick={() => setConfirmDeletePhaseId(null)}
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <>
                              {canEditPhases && (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => startEditPhase(p)}
                                >
                                  <i className="bi bi-pencil" />
                                </button>
                              )}
                              {canDeletePhases && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => setConfirmDeletePhaseId(p.id)}
                                >
                                  <i className="bi bi-trash" />
                                </button>
                              )}
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
              {canCreateMilestones && (
                <button
                  type="button"
                  className="btn btn-info text-white btn-sm"
                  disabled={!selectedPhaseId || !canViewMilestones}
                  onClick={() => setShowCreateMilestone((prev) => !prev)}
                >
                  {showCreateMilestone ? "Cancel" : "+ Add"}
                </button>
              )}
            </div>

            {!canViewMilestones ? (
              <AccessDeniedState
                title="Milestones are restricted"
                description="You do not have permission to view project milestones."
              />
            ) : !selectedPhaseId ? (
              <div className="tasks-empty-message">
                <i className="bi bi-arrow-left-circle" />
                Select a phase to view milestones
              </div>
            ) : (
              <>
                {canCreateMilestones && showCreateMilestone && (
                  <div className="task-create-card mb-3">
                    <form className="row g-2" onSubmit={handleCreateMilestone}>
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
                        <label className="form-label mb-1">Target Date</label>
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
                        {editingMilestoneId === m.id && canEditMilestones ? (
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
                                  onClick={() => setEditingMilestoneId(null)}
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
                              <strong>Milestone: {m.name || "Unnamed"}</strong>
                              <span>
                                Target:{" "}
                                {m.targetDateUtc
                                  ? new Date(
                                      m.targetDateUtc,
                                    ).toLocaleDateString()
                                  : "No target date"}
                              </span>
                            </button>
                            <div className="task-row-actions">
                              {canDeleteMilestones &&
                              confirmDeleteMilestoneId === m.id ? (
                                <span className="confirm-inline confirm-inline-sm">
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteMilestone(m.id)}
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
                                  {canEditMilestones && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => startEditMilestone(m)}
                                    >
                                      <i className="bi bi-pencil" />
                                    </button>
                                  )}
                                  {canDeleteMilestones && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() =>
                                        setConfirmDeleteMilestoneId(m.id)
                                      }
                                    >
                                      <i className="bi bi-trash" />
                                    </button>
                                  )}
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
              {canCreateTasks && (
                <button
                  type="button"
                  className="btn btn-info text-white btn-sm"
                  disabled={!selectedMilestoneId || !canViewTasks}
                  onClick={() => setShowCreateTask((prev) => !prev)}
                >
                  {showCreateTask ? "Cancel" : "+ Add"}
                </button>
              )}
            </div>

            {!canViewTasks ? (
              <AccessDeniedState
                title="Tasks are restricted"
                description="You do not have permission to view project tasks."
              />
            ) : !selectedMilestoneId ? (
              <div className="tasks-empty-message">
                <i className="bi bi-arrow-left-circle" />
                Select a milestone to view tasks
              </div>
            ) : (
              <>
                {canCreateTasks && showCreateTask && (
                  <div className="task-create-card mb-3">
                    <form className="row g-2" onSubmit={handleCreateTask}>
                      <div className="col-12">
                        <label className="form-label mb-1">Task Title</label>
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
                        <label className="form-label mb-1">Start Date</label>
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
                        <label className="form-label mb-1">Description</label>
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
                            onClick={() => onOpenTask(t.id)}
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
                            {canDeleteTasks &&
                              (confirmDeleteTaskId === t.id ? (
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
                              ))}
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
          <aside className="hierarchy-sidebar" aria-label="Selection details">
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
                    {/* <div className="detail-row detail-id">
                          <span>Phase ID</span>
                          <strong>{selectedPhase.id}</strong>
                        </div> */}
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
                        {canCreateMilestoneApprovals && (
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
                        )}
                      </div>

                      {!currentUserId && (
                        <p className="detail-approvals-note mb-2">
                          Unable to detect the logged-in user for approverId.
                        </p>
                      )}

                      {canCreateMilestoneApprovals && showCreateApproval && (
                        <div className="detail-approval-form mb-2">
                          <div className="row g-2">
                            <div className="col-12 col-md-4">
                              <label className="form-label mb-1">Status</label>
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
                                disabled={creatingApproval || !currentUserId}
                              >
                                {creatingApproval
                                  ? "Adding..."
                                  : "Save Approval"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {!canViewMilestoneApprovals ? (
                        <AccessDeniedState
                          title="Approvals are restricted"
                          description="You do not have permission to view milestone approvals."
                        />
                      ) : approvalsLoading ? (
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
                              {editingApprovalId === approval.id &&
                              canEditMilestoneApprovals ? (
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
                                        value={editApprovalForm.decidedAtUtc}
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
                                      {ApprovalStatus[approval.status ?? 0] ||
                                        "Unknown"}
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
                                  {(canEditMilestoneApprovals ||
                                    canDeleteMilestoneApprovals) && (
                                    <div className="task-row-actions">
                                      {canDeleteMilestoneApprovals &&
                                      confirmDeleteApprovalId ===
                                        approval.id ? (
                                        <span className="confirm-inline confirm-inline-sm">
                                          <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() =>
                                              handleDeleteApproval(approval.id)
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
                                          {canEditMilestoneApprovals && (
                                            <button
                                              type="button"
                                              className="btn btn-outline-primary btn-sm"
                                              onClick={() =>
                                                startEditApproval(approval)
                                              }
                                            >
                                              <i className="bi bi-pencil" />
                                            </button>
                                          )}
                                          {canDeleteMilestoneApprovals && (
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
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* <div className="detail-row detail-id">
                          <span>Milestone ID</span>
                          <strong>{selectedMilestone.id}</strong>
                        </div> */}
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
                      <strong>{phaseVisualSummary.taskProgressPercent}%</strong>
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
                    Task completion is calculated from tasks with status "Done"
                    only.
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
                                        background: getTaskStatusColor(status),
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
  );
}
