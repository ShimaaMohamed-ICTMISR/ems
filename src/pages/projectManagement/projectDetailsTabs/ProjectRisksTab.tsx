import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
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
import { AccessDeniedState } from "../../../Components/AccessDeniedState";
import {
  RiskEventStatus,
  RiskImpact,
  RiskProbability,
} from "../../../config/enums";
import type {
  Risk,
  RiskEvent,
} from "../../../services/projectManagementServices/riskService";

type RiskFormState = {
  description: string;
  probability: string;
  impact: string;
  mitigationPlan: string;
  ownerId: string;
};

type RiskEventFormState = {
  incidentDescription: string;
  status: string;
  occurredAtUtc: string;
};

type RiskSeverityBucket = "high" | "medium" | "low";

type RiskSummaryDatum = {
  name: string;
  key: string;
  value: number;
  color: string;
};

type RiskEventsChartDatum = {
  id: string;
  name: string;
  events: number;
};

type ProjectRisksTabProps = {
  canCreateRisks: boolean;
  showCreateRisk: boolean;
  setShowCreateRisk: Dispatch<SetStateAction<boolean>>;
  canViewRisks: boolean;
  riskSummaryData: RiskSummaryDatum[];
  canViewRiskEvents: boolean;
  riskEventsChartData: RiskEventsChartDatum[];
  riskSeverityFilter: "all" | "high" | "medium" | "low";
  setRiskSeverityFilter: Dispatch<
    SetStateAction<"all" | "high" | "medium" | "low">
  >;
  riskSortBy: "recent" | "impact" | "probability" | "severity";
  setRiskSortBy: Dispatch<
    SetStateAction<"recent" | "impact" | "probability" | "severity">
  >;
  handleCreateRisk: (event: FormEvent<HTMLFormElement>) => void;
  newRisk: RiskFormState;
  handleNewRiskChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  creatingRisk: boolean;
  risksLoading: boolean;
  displayedRisks: Risk[];
  expandedRiskId: string | null;
  riskEventsByRisk: Record<string, RiskEvent[]>;
  riskEventsLoadingByRisk: Record<string, boolean>;
  getRiskSeverityBucket: (risk: Risk) => RiskSeverityBucket;
  getRiskSeverityColor: (bucket: RiskSeverityBucket) => string;
  getRiskSeverityLabel: (risk: Risk) => string;
  editingRiskId: string | null;
  canEditRisks: boolean;
  startEditRisk: (risk: Risk) => void;
  editRiskForm: RiskFormState;
  handleEditRiskChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleUpdateRisk: (risk: Risk) => void;
  setEditingRiskId: Dispatch<SetStateAction<string | null>>;
  canDeleteRisks: boolean;
  confirmDeleteRiskId: string | null;
  handleDeleteRisk: (riskId: string) => void;
  setConfirmDeleteRiskId: Dispatch<SetStateAction<string | null>>;
  canAccessRiskEvents: boolean;
  handleToggleRiskExpansion: (riskId: string) => void;
  canCreateRiskEvents: boolean;
  setShowCreateEventForRiskId: Dispatch<SetStateAction<string | null>>;
  showCreateEventForRiskId: string | null;
  newRiskEvent: RiskEventFormState;
  handleNewRiskEventChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleCreateRiskEvent: (
    event: FormEvent<HTMLFormElement>,
    riskId: string,
  ) => void;
  creatingRiskEvent: boolean;
  editingRiskEventId: string | null;
  canEditRiskEvents: boolean;
  editRiskEventForm: RiskEventFormState;
  handleEditRiskEventChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleUpdateRiskEvent: (eventItem: RiskEvent) => void;
  setEditingRiskEventId: Dispatch<SetStateAction<string | null>>;
  canDeleteRiskEvents: boolean;
  confirmDeleteRiskEventId: string | null;
  handleDeleteRiskEvent: (eventId: string, riskId: string) => void;
  setConfirmDeleteRiskEventId: Dispatch<SetStateAction<string | null>>;
  startEditRiskEvent: (eventItem: RiskEvent) => void;
  formatDate: (value?: string | null) => string;
};

export function ProjectRisksTab({
  canCreateRisks,
  showCreateRisk,
  setShowCreateRisk,
  canViewRisks,
  riskSummaryData,
  canViewRiskEvents,
  riskEventsChartData,
  riskSeverityFilter,
  setRiskSeverityFilter,
  riskSortBy,
  setRiskSortBy,
  handleCreateRisk,
  newRisk,
  handleNewRiskChange,
  creatingRisk,
  risksLoading,
  displayedRisks,
  expandedRiskId,
  riskEventsByRisk,
  riskEventsLoadingByRisk,
  getRiskSeverityBucket,
  getRiskSeverityColor,
  getRiskSeverityLabel,
  editingRiskId,
  canEditRisks,
  startEditRisk,
  editRiskForm,
  handleEditRiskChange,
  handleUpdateRisk,
  setEditingRiskId,
  canDeleteRisks,
  confirmDeleteRiskId,
  handleDeleteRisk,
  setConfirmDeleteRiskId,
  canAccessRiskEvents,
  handleToggleRiskExpansion,
  canCreateRiskEvents,
  setShowCreateEventForRiskId,
  showCreateEventForRiskId,
  newRiskEvent,
  handleNewRiskEventChange,
  handleCreateRiskEvent,
  creatingRiskEvent,
  editingRiskEventId,
  canEditRiskEvents,
  editRiskEventForm,
  handleEditRiskEventChange,
  handleUpdateRiskEvent,
  setEditingRiskEventId,
  canDeleteRiskEvents,
  confirmDeleteRiskEventId,
  handleDeleteRiskEvent,
  setConfirmDeleteRiskEventId,
  startEditRiskEvent,
  formatDate,
}: ProjectRisksTabProps) {
  return (
    <section className="tasks-section">
      <div className="tasks-section-header">
        <h2>
          <i className="bi bi-shield-exclamation me-2" />
          Risk Management
        </h2>
        {canCreateRisks && (
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
        )}
      </div>

      {!canViewRisks ? (
        <AccessDeniedState
          title="Risks are restricted"
          description="You can access this tab, but your role does not include Risks.View to display risk records."
        />
      ) : (
        <>
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
                {canViewRiskEvents ? (
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
                ) : (
                  <AccessDeniedState
                    title="Risk events analytics are restricted"
                    description="You do not have permission to view risk event data."
                  />
                )}
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

          {canCreateRisks && showCreateRisk && (
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
                    {editingRiskId === risk.id && canEditRisks ? (
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
                            {canEditRisks && (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => startEditRisk(risk)}
                                title="Edit risk"
                              >
                                <i className="bi bi-pencil" />
                              </button>
                            )}
                            {canDeleteRisks &&
                              (confirmDeleteRiskId === risk.id ? (
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
                                  onClick={() =>
                                    setConfirmDeleteRiskId(risk.id)
                                  }
                                  title="Delete risk"
                                >
                                  <i className="bi bi-trash" />
                                </button>
                              ))}
                            {canAccessRiskEvents && (
                              <button
                                type="button"
                                className="btn btn-outline-info btn-sm"
                                onClick={() =>
                                  handleToggleRiskExpansion(risk.id)
                                }
                                title="Show events"
                              >
                                <i
                                  className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`}
                                />
                                <span className="ms-1">Events</span>
                              </button>
                            )}
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
                          {canCreateRiskEvents && (
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
                          )}
                        </div>

                        {canCreateRiskEvents &&
                          showCreateEventForRiskId === risk.id && (
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
                                <label className="form-label mb-1">
                                  Status
                                </label>
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

                        {!canViewRiskEvents ? (
                          <AccessDeniedState
                            title="Risk events are restricted"
                            description="You do not have permission to view risk events for this risk."
                          />
                        ) : eventsLoading ? (
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
                                {editingRiskEventId === eventItem.id &&
                                canEditRiskEvents ? (
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
                                    {(canEditRiskEvents ||
                                      canDeleteRiskEvents) && (
                                      <div className="task-row-actions">
                                        {canEditRiskEvents && (
                                          <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() =>
                                              startEditRiskEvent(eventItem)
                                            }
                                          >
                                            <i className="bi bi-pencil" />
                                          </button>
                                        )}
                                        {canDeleteRiskEvents &&
                                          (confirmDeleteRiskEventId ===
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
                                                  setConfirmDeleteRiskEventId(
                                                    null,
                                                  )
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
                                          ))}
                                      </div>
                                    )}
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
        </>
      )}
    </section>
  );
}
