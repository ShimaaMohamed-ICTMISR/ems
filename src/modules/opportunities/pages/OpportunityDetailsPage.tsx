import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  approveQuote,
  assignOpportunity,
  changeOpportunityStage,
  closeOpportunity,
  createQuote,
  deleteOpportunity,
  getOpportunityById,
  getOpportunityHistory,
  getQuotesForOpportunity,
  updateOpportunity,
} from "../api/opportunityApi";
import type {
  ChangeStageDto,
  CloseOpportunityDto,
  CreateQuoteDto,
  Opportunity,
  OpportunityHistory,
  OpportunityStageApi,
  Quote,
  UpdateOpportunityDto,
} from "../types/opportunity.types";
import {
  hasApprovedQuoteFromList,
  isOpportunityClosedStage,
  normalizeStage,
  opportunityAssigneeDisplayName,
  opportunityDisplayAmount,
  opportunityDisplayName,
} from "../utils/opportunityFlow";
import { useHrEmployees } from "../hooks/useHrEmployees";
import {
  clearStoredAssigneeDisplay,
  getStoredAssigneeLabel,
  setStoredAssigneeDisplay,
} from "../utils/opportunityAssigneeStorage";
import { StageEntriesSection } from "../components/StageEntriesSection";
import { notificationService } from "../../../services/notificationService";
import { AccessDeniedState } from "../../../Components/AccessDeniedState";
import { useOpportunitiesPermissions } from "../../../hooks/useOpportunitiesPermissions";
import {
  OPPORTUNITY_PERMISSION_KEYS,
  OPPORTUNITY_ROUTE_PERMISSION_KEYS,
} from "../../../config/opportunitiesPermissions";

const STAGE_LABELS: Record<OpportunityStageApi, string> = {
  prospecting: "Prospecting",
  qualification: "Qualification",
  needs_analysis: "Needs Analysis",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed – Won",
  closed_lost: "Closed – Lost",
};

const quoteStatusLabel = (status: string | undefined): string => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized || "UNKNOWN";
};

const quoteStatusClass = (status: string | undefined): string => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "APPROVED") return "bg-success";
  if (normalized === "REJECTED") return "bg-danger";
  return "bg-secondary";
};

// (Removed) OPEN_STAGES: was used for filtered stage list; UI now shows all stages.

export function OpportunityDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [history, setHistory] = useState<OpportunityHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [stageOpen, setStageOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [stageForm, setStageForm] = useState<Pick<ChangeStageDto, "stage">>({
    stage: "prospecting",
  });
  const [assignForm, setAssignForm] = useState<{ userId: string }>({
    userId: "",
  });
  const [assigneeLabelOverride, setAssigneeLabelOverride] = useState<
    string | null
  >(null);
  const [closeForm, setCloseForm] = useState<CloseOpportunityDto>({
    type: "won",
    reason: "",
  });
  const [quoteForm, setQuoteForm] = useState<CreateQuoteDto>({
    validUntil: new Date().toISOString().slice(0, 10),
    totalAmount: undefined,
    currency: "USD",
  });

  // Get the latest quote date for validation
  const latestQuoteDate = useMemo(() => {
    if (!quotes || quotes.length === 0) return null;
    const dates = quotes
      .map((q) => q.validUntil)
      .filter((date) => date)
      .map((date) => new Date(date))
      .filter((date) => !isNaN(date.getTime())) // Filter out invalid dates
      .sort((a, b) => b.getTime() - a.getTime());
    return dates.length > 0 ? dates[0] : null;
  }, [quotes]);

  // Validate quote date
  const isQuoteDateValid = useMemo(() => {
    if (!latestQuoteDate) return true;
    const newQuoteDate = new Date(quoteForm.validUntil);
    if (isNaN(newQuoteDate.getTime())) return false; // Invalid date
    return newQuoteDate >= latestQuoteDate;
  }, [quoteForm.validUntil, latestQuoteDate]);
  const [editForm, setEditForm] = useState<UpdateOpportunityDto>({
    name: "",
    stage: "prospecting",
    amount: undefined,
    expectedCloseDate: "",
    type: "",
    source: "",
    description: "",
    nextStep: "",
  });

  const {
    employees: hrEmployees,
    loading: hrEmployeesLoading,
    loadError: hrEmployeesError,
  } = useHrEmployees();
  const { canAny } = useOpportunitiesPermissions();

  const canChangeStageOpportunity = canAny([
    ...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.CHANGE_STAGE,
  ]);
  const canAssignOpportunity = canAny([
    ...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.ASSIGN,
  ]);
  const canEditOpportunity = canAny([
    ...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.EDIT,
  ]);
  const canCloseOpportunity = canAny([
    ...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.CLOSE,
  ]);
  const canCreateQuote = canAny([...OPPORTUNITY_PERMISSION_KEYS.QUOTES.CREATE]);
  const canApproveQuote = canAny([
    ...OPPORTUNITY_PERMISSION_KEYS.QUOTES.APPROVE,
  ]);
  const canDeleteOpportunity = canAny([
    ...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.DELETE,
  ]);
  const canViewHistory = canAny([...OPPORTUNITY_ROUTE_PERMISSION_KEYS.HISTORY]);
  const canViewQuotes = canAny([
    ...OPPORTUNITY_PERMISSION_KEYS.QUOTES.VIEW,
    ...OPPORTUNITY_ROUTE_PERMISSION_KEYS.DETAILS,
  ]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [o, q, h] = await Promise.all([
        getOpportunityById(id),
        getQuotesForOpportunity(id).catch(() => []),
        getOpportunityHistory(id).catch(() => []),
      ]);
      setOpp(o);
      setQuotes(q);
      setHistory(h);
      setStageForm({
        stage: normalizeStage(String(o.stage)),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load opportunity.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setAssigneeLabelOverride(null);
  }, [id]);

  const stage = opp ? normalizeStage(String(opp.stage)) : "prospecting";
  const closed = isOpportunityClosedStage(opp?.stage);
  const approvedFromApi = opp?.hasApprovedQuote === true;
  const approvedFromQuotes = hasApprovedQuoteFromList(quotes);
  const hasApprovedQuote = approvedFromApi || approvedFromQuotes;
  const hasSignedContract = opp?.hasSignedContract === true;
  const eligibleCloseWon = hasApprovedQuote && hasSignedContract;
  const hasHeaderActions =
    canChangeStageOpportunity ||
    canAssignOpportunity ||
    canEditOpportunity ||
    canCloseOpportunity ||
    canCreateQuote ||
    canDeleteOpportunity;
  const stageOptionsForSelect = useMemo(() => {
    if (closed) return [];
    return Object.keys(STAGE_LABELS) as OpportunityStageApi[];
  }, [closed]);

  const employeeOverviewLabel = useMemo(() => {
    if (!opp || !id) return "—";
    const fromApi = opportunityAssigneeDisplayName(opp, hrEmployees);
    if (fromApi !== "—") return fromApi;
    if (assigneeLabelOverride) return assigneeLabelOverride;
    return getStoredAssigneeLabel(id) ?? "—";
  }, [opp, id, hrEmployees, assigneeLabelOverride]);

  useEffect(() => {
    if (!id || !opp) return;
    if (opportunityAssigneeDisplayName(opp, hrEmployees) !== "—") {
      clearStoredAssigneeDisplay(id);
    }
  }, [id, opp, hrEmployees]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };
  if (!id) {
    return <div className="p-4">Invalid opportunity.</div>;
  }

  const isValidDateOnly = (value: string | undefined): boolean => {
    if (!value) return false;
    // Expect yyyy-mm-dd
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime());
  };

  const isPastDateOnly = (value: string): boolean => {
    const today = new Date();
    const todayOnly = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const d = new Date(`${value}T00:00:00Z`);
    return d.getTime() < todayOnly.getTime();
  };

  const openEdit = () => {
    if (!opp) return;
    setEditForm({
      name: (opp.name ?? opp.title ?? "").toString(),
      stage: normalizeStage(String(opp.stage)),
      amount: opportunityDisplayAmount(opp),
      expectedCloseDate: opp.expectedCloseDate
        ? String(opp.expectedCloseDate).slice(0, 10)
        : "",
      type: opp.type ?? "",
      source: opp.source ?? "",
      description: opp.description ?? "",
      nextStep: opp.nextStep ?? "",
    });
    setEditOpen(true);
  };

  const buildUpdatePayload = (
    raw: UpdateOpportunityDto,
  ): UpdateOpportunityDto => {
    const payload: UpdateOpportunityDto = {};
    const name = raw.name?.toString().trim();
    if (name) payload.name = name;
    if (raw.stage) payload.stage = raw.stage;
    if (raw.amount !== undefined && raw.amount !== null) {
      const n = Number(raw.amount);
      if (Number.isFinite(n)) payload.amount = n;
    }
    const expectedCloseDate = raw.expectedCloseDate?.toString().trim();
    if (expectedCloseDate) payload.expectedCloseDate = expectedCloseDate;
    const type = raw.type?.toString().trim();
    if (type) payload.type = type;
    const source = raw.source?.toString().trim();
    if (source) payload.source = source;
    const description = raw.description?.toString().trim();
    if (description) payload.description = description;
    const nextStep = raw.nextStep?.toString().trim();
    if (nextStep) payload.nextStep = nextStep;
    return payload;
  };

  if (loading && !opp) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error && !opp) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">{error}</div>
        <Link
          to="/dashboard/opportunities"
          className="btn btn-outline-secondary"
        >
          Back to list
        </Link>
      </div>
    );
  }

  if (!opp) return null;

  return (
    <div
      className="opportunity-details-page container-fluid py-4"
      style={{
        background: "#ffffff",
        minHeight: "100vh",
      }}
    >
      {/* Header - matching voting/meetings style */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: "52px",
              height: "52px",
              background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
              boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
            }}
          >
            <i className="bi bi-graph-up-arrow text-white fs-4" />
          </div>{" "}
          <div>
            <Link
              to="/dashboard/opportunities"
              className="btn btn-link text-decoration-none ps-0 mb-2"
              style={{
                color: "#06b6d4",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              <i className="bi bi-arrow-left me-1" />
              Back to Opportunities
            </Link>
            <h2
              className="mb-1 fw-bold"
              style={{
                color: "#0f172a",
                background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {opportunityDisplayName(opp)}
            </h2>
            <p className="mb-0" style={{ color: "#64748b" }}>
              Opportunity details and management
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {canChangeStageOpportunity && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              disabled={closed || busy}
              onClick={() => setStageOpen(true)}
            >
              <i className="bi bi-kanban me-1" />
              Change stage
            </button>
          )}
          {canAssignOpportunity && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={closed || busy}
              onClick={() => {
                setAssignForm({ userId: "" });
                setAssignOpen(true);
              }}
            >
              <i className="bi bi-person-plus me-1" />
              Assign
            </button>
          )}
          {canEditOpportunity && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={closed || busy}
              onClick={openEdit}
              title="Update opportunity"
            >
              <i className="bi bi-pencil-square me-1" />
              Edit
            </button>
          )}
          {canCloseOpportunity && (
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              disabled={closed || busy}
              onClick={() => setCloseOpen(true)}
            >
              <i className="bi bi-flag me-1" />
              Close
            </button>
          )}
          {canCreateQuote && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={closed || busy}
              onClick={() => setQuoteOpen(true)}
            >
              <i className="bi bi-plus-circle me-1" />
              New quote
            </button>
          )}
          {canDeleteOpportunity && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              disabled={busy}
              onClick={() => {
                const confirmed = window.confirm(
                  `Delete opportunity "${opportunityDisplayName(opp)}"?`,
                );
                if (!confirmed) return;
                void run(async () => {
                  await deleteOpportunity(id);
                  navigate("/dashboard/opportunities");
                });
              }}
              title="Delete opportunity"
            >
              <i className="bi bi-trash3 me-1" />
              Delete
            </button>
          )}
          {!hasHeaderActions && (
            <span className="small text-muted">No actions available</span>
          )}
        </div>
      </div>
      {error && (
        <div
          className="alert alert-danger border-0 mb-3"
          style={{ borderRadius: "12px" }}
        >
          <strong>Notice:</strong> {error}
        </div>
      )}{" "}
      {/* Stage Badge */}
      <div className="mb-4">
        <span
          className="badge px-3 py-2"
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
            color: "#ffffff",
            borderRadius: "12px",
            fontSize: "0.9rem",
            fontWeight: "500",
            boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
          }}
        >
          {STAGE_LABELS[stage] ?? stage}
        </span>
      </div>
      <div className="row g-4">
        {/* Overview Card - voting/meetings style */}
        <div className="col-12">
          <div
            className="card"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                content: "",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background:
                  "linear-gradient(90deg, #06b6d4 0%, #0891b2 50%, #06b6d4 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3s ease-in-out infinite",
              }}
            />{" "}
            <div
              className="card-header border-0"
              style={{
                backgroundColor: "#ffffff",
                borderLeft: "4px solid #06b6d4",
                padding: "1rem 1.5rem",
              }}
            >
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: "#0f172a" }}>
                  <i
                    className="bi bi-info-circle me-2"
                    style={{ color: "#06b6d4" }}
                  />
                  Overview
                </h5>
                <small style={{ color: "#64748b" }}>
                  Key opportunity metrics and information
                </small>
              </div>
            </div>
            <div
              className="card-body"
              style={{ padding: "1.25rem", position: "relative", zIndex: 1 }}
            >
              <div className="row g-4">
                <div className="col-md-4">
                  <div
                    className="text-center p-3"
                    style={{
                      backgroundColor: "#f0f9ff",
                      borderRadius: "12px",
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <i
                      className="bi bi-currency-dollar mb-2"
                      style={{
                        fontSize: "1.5rem",
                        color: "#06b6d4",
                      }}
                    />
                    <h6
                      className="text-uppercase small mb-2 fw-semibold"
                      style={{ color: "#64748b" }}
                    >
                      Amount
                    </h6>
                    <h3 className="mb-0 fw-bold" style={{ color: "#0f172a" }}>
                      {opportunityDisplayAmount(opp).toLocaleString()}
                    </h3>
                  </div>
                </div>
                <div className="col-md-4">
                  <div
                    className="text-center p-3"
                    style={{
                      backgroundColor: "#f0f9ff",
                      borderRadius: "12px",
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <i
                      className="bi bi-calendar-event mb-2"
                      style={{
                        fontSize: "1.5rem",
                        color: "#06b6d4",
                      }}
                    />
                    <h6
                      className="text-uppercase small mb-2 fw-semibold"
                      style={{ color: "#64748b" }}
                    >
                      Expected Close
                    </h6>
                    <h4 className="mb-0 fw-bold" style={{ color: "#0f172a" }}>
                      {opp.expectedCloseDate
                        ? new Date(opp.expectedCloseDate).toLocaleDateString()
                        : "—"}
                    </h4>
                  </div>
                </div>
                <div className="col-md-4">
                  <div
                    className="text-center p-3"
                    style={{
                      backgroundColor: "#f0f9ff",
                      borderRadius: "12px",
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <i
                      className="bi bi-person-circle mb-2"
                      style={{
                        fontSize: "1.5rem",
                        color: "#06b6d4",
                      }}
                    />
                    <h6
                      className="text-uppercase small mb-2 fw-semibold"
                      style={{ color: "#64748b" }}
                    >
                      Assigned Employee
                    </h6>
                    <h4 className="mb-0 fw-bold" style={{ color: "#0f172a" }}>
                      {employeeOverviewLabel}
                    </h4>
                  </div>
                </div>
                {opp.description && (
                  <div className="col-12">
                    <div
                      className="mt-3 p-3"
                      style={{
                        backgroundColor: "#f0f9ff",
                        border: "1px solid #bae6fd",
                        borderRadius: "12px",
                        borderLeft: "4px solid #06b6d4",
                      }}
                    >
                      <h6
                        className="text-uppercase small mb-2 fw-semibold"
                        style={{ color: "#64748b" }}
                      >
                        <i
                          className="bi bi-file-text me-2"
                          style={{ color: "#06b6d4" }}
                        />
                        Description
                      </h6>
                      <p
                        className="mb-0"
                        style={{ color: "#0f172a", lineHeight: "1.6" }}
                      >
                        {opp.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <StageEntriesSection
            opportunityId={id}
            opportunityStage={opp?.stage}
          />
        </div>
        {/* Quotes Card - voting/meetings style */}
        <div className="col-lg-8">
          <div
            className="card"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              marginBottom: "1rem",
            }}
          >
            {" "}
            <div
              style={{
                content: "",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background:
                  "linear-gradient(90deg, #38bdf8 0%, #0ea5e9 50%, #38bdf8 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3s ease-in-out infinite",
              }}
            />
            <div
              className="card-header border-0"
              style={{
                backgroundColor: "#ffffff",
                borderLeft: "4px solid #0ea5e9",
                padding: "1rem 1.5rem",
              }}
            >
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: "#0f172a" }}>
                  <i
                    className="bi bi-file-earmark-text me-2"
                    style={{ color: "#0ea5e9" }}
                  />
                  Quotes
                </h5>
                <small style={{ color: "#64748b" }}>
                  Proposals and pricing information
                </small>
              </div>
            </div>
            <div className="card-body p-0">
              {!canViewQuotes ? (
                <div className="p-3">
                  <AccessDeniedState
                    title="Quotes Access Restricted"
                    description="You do not currently have permission to view quotes for this opportunity. Please contact your administrator if you need access."
                  />
                </div>
              ) : quotes.length === 0 ? (
                <div
                  className="text-center py-5"
                  style={{
                    padding: "2rem 1.5rem",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{
                      width: "64px",
                      height: "64px",
                      background:
                        "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
                    }}
                  >
                    <i
                      className="bi bi-file-earmark-plus text-white"
                      style={{ fontSize: "1.5rem" }}
                    />
                  </div>
                  <h6 className="mb-2" style={{ color: "#0f172a" }}>
                    No quotes yet
                  </h6>
                  <p
                    className="mb-0"
                    style={{ color: "#64748b", fontSize: "1rem" }}
                  >
                    Create your first quote to start the proposal process.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ color: "#0f172a", fontWeight: "600" }}>
                          ID
                        </th>
                        <th style={{ color: "#0f172a", fontWeight: "600" }}>
                          Amount
                        </th>
                        <th style={{ color: "#0f172a", fontWeight: "600" }}>
                          Status
                        </th>
                        <th style={{ color: "#0f172a", fontWeight: "600" }}>
                          Valid until
                        </th>
                        {canApproveQuote && (
                          <th
                            style={{ color: "#0f172a", fontWeight: "600" }}
                            className="text-end"
                          >
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((q) => {
                        const isApproved =
                          String(q.status ?? "").toUpperCase() === "APPROVED";
                        return (
                          <tr key={q.id}>
                            <td>
                              <code
                                className="small px-2 py-1"
                                style={{
                                  backgroundColor: "#f0f9ff",
                                  color: "#0e7490",
                                  borderRadius: "6px",
                                  fontWeight: "500",
                                }}
                              >
                                {q.id.slice(0, 8)}…
                              </code>
                            </td>
                            <td style={{ color: "#0f172a", fontWeight: "500" }}>
                              {q.totalAmount?.toLocaleString?.() ?? "—"}
                            </td>
                            <td>
                              <span
                                className={`badge ${quoteStatusClass(q.status)} px-3 py-2`}
                              >
                                {quoteStatusLabel(q.status)}
                              </span>
                            </td>
                            <td style={{ color: "#64748b" }}>
                              {q.validUntil
                                ? new Date(q.validUntil).toLocaleDateString()
                                : "—"}
                            </td>
                            {canApproveQuote && (
                              <td className="text-end">
                                {isApproved ? (
                                  <span className="small text-muted">
                                    Already approved
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm"
                                    disabled={busy}
                                    onClick={() => {
                                      const confirmed = window.confirm(
                                        "Approve this quote?",
                                      );
                                      if (!confirmed) return;
                                      void run(async () => {
                                        await approveQuote(id, q.id, {});
                                      });
                                    }}
                                  >
                                    Approve
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>{" "}
        {/* History Card - voting/meetings style */}
        <div className="col-lg-4">
          <div
            className="card"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                content: "",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background:
                  "linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #8b5cf6 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3s ease-in-out infinite",
              }}
            />
            <div
              className="card-header border-0"
              style={{
                backgroundColor: "#ffffff",
                borderLeft: "4px solid #8b5cf6",
                padding: "1rem 1.5rem",
              }}
            >
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: "#0f172a" }}>
                  <i
                    className="bi bi-clock-history me-2"
                    style={{ color: "#8b5cf6" }}
                  />
                  History
                </h5>
                <small style={{ color: "#64748b" }}>Activity timeline</small>
              </div>
            </div>
            <div
              className="card-body"
              style={{ padding: "1.25rem", position: "relative", zIndex: 1 }}
            >
              {!canViewHistory ? (
                <AccessDeniedState
                  title="History Access Restricted"
                  description="You do not currently have permission to view opportunity history. Please contact your administrator if you need access."
                />
              ) : history.length === 0 ? (
                <div
                  className="text-center py-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{
                      width: "64px",
                      height: "64px",
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    }}
                  >
                    <i
                      className="bi bi-clock text-white"
                      style={{ fontSize: "1.5rem" }}
                    />
                  </div>
                  <h6 className="mb-2" style={{ color: "#0f172a" }}>
                    No history entries
                  </h6>
                  <p
                    className="mb-0"
                    style={{ color: "#64748b", fontSize: "1rem" }}
                  >
                    Activity history will appear here.
                  </p>
                </div>
              ) : (
                <div>
                  {history.map((h, index) => (
                    <div
                      key={h.id}
                      className="d-flex align-items-start mb-3 pb-3"
                      style={{
                        borderBottom:
                          index < history.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "32px",
                          height: "32px",
                          background:
                            "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className="bi bi-circle-fill text-white"
                          style={{ fontSize: "0.5rem" }}
                        ></i>
                      </div>{" "}
                      <div className="flex-grow-1">
                        <div
                          className="fw-semibold mb-1"
                          style={{ color: "#0f172a" }}
                        >
                          {h.action}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <small style={{ color: "#64748b" }}>
                            {h.createdAt
                              ? new Date(h.createdAt).toLocaleString()
                              : ""}
                          </small>
                          {h.newValue && (
                            <>
                              <span style={{ color: "#d1d5db" }}>•</span>
                              <small
                                className="px-2 py-1"
                                style={{
                                  backgroundColor: "#f0f9ff",
                                  color: "#0e7490",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: "500",
                                }}
                              >
                                {h.newValue}
                              </small>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Modals - voting/meetings style */}
      {stageOpen && canChangeStageOpportunity && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="modal-header"
                style={{
                  borderBottom: "2px solid #e2e8f0",
                  borderRadius: "16px 16px 0 0",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <h5
                  className="modal-title"
                  style={{ color: "#0f172a", fontWeight: "600" }}
                >
                  Change stage
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !busy && setStageOpen(false)}
                />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!stageOptionsForSelect.includes(stageForm.stage)) {
                    setError("Please select a valid stage.");
                    return;
                  }
                  void run(async () => {
                    await changeOpportunityStage(id, {
                      stage: stageForm.stage,
                    });
                    setStageOpen(false);
                  });
                }}
              >
                <div className="modal-body">
                  <label
                    className="form-label"
                    style={{ color: "#0f172a", fontWeight: "600" }}
                  >
                    <i
                      className="bi bi-kanban me-2"
                      style={{ color: "#06b6d4" }}
                    />
                    Stage
                  </label>
                  <select
                    className="form-select"
                    value={stageForm.stage}
                    onChange={(e) =>
                      setStageForm({
                        stage: e.target.value as OpportunityStageApi,
                      })
                    }
                    style={{
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "0.75rem 1rem",
                      fontSize: "0.95rem",
                      transition: "all 0.3s ease",
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {stageOptionsForSelect.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>{" "}
                <div
                  className="modal-footer"
                  style={{
                    borderTop: "2px solid #e2e8f0",
                    borderRadius: "0 0 16px 16px",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setStageOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {assignOpen && canAssignOpportunity && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
              }}
            >
              <div
                className="modal-header"
                style={{
                  borderBottom: "2px solid #e2e8f0",
                  borderRadius: "16px 16px 0 0",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <h5
                  className="modal-title"
                  style={{ color: "#0f172a", fontWeight: 600 }}
                >
                  Assign Opportunity -{" "}
                  {opp ? opportunityDisplayName(opp) : "..."}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !busy && setAssignOpen(false)}
                />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    const selectedId = assignForm.userId;
                    if (!selectedId) {
                      setError("Please select an employee to assign.");
                      return;
                    }
                    await assignOpportunity(id, {
                      userId: selectedId,
                      role: "owner",
                    });
                    const emp = hrEmployees.find((x) => x.id === selectedId);
                    const label = emp
                      ? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() ||
                        emp.email ||
                        emp.id
                      : selectedId;
                    try {
                      await notificationService.createNotification({
                        userId: selectedId,
                        channel: "IN_APP",
                        category: "TRANSACTIONAL",
                        priority: "NORMAL",
                        subject: "New Opportunity Assignment",
                        bodyText: `You have been assigned to opportunity "${opportunityDisplayName(opp)}".`,
                        sourceEvent: "OpportunityAssigned",
                        sourceEntityId: id,
                        sourceEntityType: "Opportunity",
                        metadata: {
                          opportunityId: id,
                          opportunityName: opportunityDisplayName(opp),
                        },
                      });
                    } catch (notifyError) {
                      // Do not fail the assignment if notification service is down.
                      console.warn(
                        "Assignment succeeded but notification failed:",
                        notifyError,
                      );
                    }
                    setAssigneeLabelOverride(label);
                    if (id) setStoredAssigneeDisplay(id, selectedId, label);
                    setAssignOpen(false);
                  });
                }}
              >
                <div className="modal-body">
                  <label
                    className="form-label"
                    style={{ color: "#0f172a", fontWeight: 600 }}
                  >
                    Employee
                  </label>
                  {hrEmployeesLoading && (
                    <div className="small text-muted mb-1">
                      Loading employees...
                    </div>
                  )}
                  {hrEmployeesError && (
                    <div className="alert alert-warning py-2 small mb-2">
                      {hrEmployeesError}
                    </div>
                  )}
                  <select
                    className="form-select"
                    required
                    value={assignForm.userId}
                    onChange={(e) => setAssignForm({ userId: e.target.value })}
                    disabled={hrEmployeesLoading}
                  >
                    <option value="">Select employee...</option>
                    {hrEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - {emp.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="modal-footer"
                  style={{
                    borderTop: "2px solid #e2e8f0",
                    borderRadius: "0 0 16px 16px",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setAssignOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy || hrEmployeesLoading || !assignForm.userId}
                  >
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {closeOpen && canCloseOpportunity && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
              }}
            >
              <div
                className="modal-header"
                style={{
                  borderBottom: "2px solid #e2e8f0",
                  borderRadius: "16px 16px 0 0",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <h5
                  className="modal-title"
                  style={{ color: "#0f172a", fontWeight: 600 }}
                >
                  Close opportunity
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !busy && setCloseOpen(false)}
                />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (closeForm.type === "won" && !eligibleCloseWon) {
                    setError(
                      "Cannot close as Won until there is an approved quote and a signed contract.",
                    );
                    return;
                  }
                  if (
                    closeForm.type === "lost" &&
                    !String(closeForm.reason ?? "").trim()
                  ) {
                    setError("Please provide a reason when closing as Lost.");
                    return;
                  }
                  void run(async () => {
                    await closeOpportunity(id, closeForm);
                    setCloseOpen(false);
                    navigate("/dashboard/opportunities");
                  });
                }}
              >
                <div className="modal-body">
                  {closeForm.type === "won" && !eligibleCloseWon && (
                    <div className="alert alert-info small">
                      Backend may reject close won without approved quote and
                      signed contract.
                    </div>
                  )}
                  <label
                    className="form-label"
                    style={{ color: "#0f172a", fontWeight: 600 }}
                  >
                    Result
                  </label>
                  <select
                    className="form-select"
                    value={closeForm.type}
                    onChange={(e) =>
                      setCloseForm({
                        ...closeForm,
                        type: e.target.value as "won" | "lost",
                      })
                    }
                  >
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                  <label
                    className="form-label mt-2"
                    style={{ color: "#0f172a", fontWeight: 600 }}
                  >
                    Reason (optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={closeForm.reason ?? ""}
                    onChange={(e) =>
                      setCloseForm({ ...closeForm, reason: e.target.value })
                    }
                  />
                </div>
                <div
                  className="modal-footer"
                  style={{
                    borderTop: "2px solid #e2e8f0",
                    borderRadius: "0 0 16px 16px",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setCloseOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {quoteOpen && canCreateQuote && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
              }}
            >
              <div
                className="modal-header"
                style={{
                  borderBottom: "2px solid #e2e8f0",
                  borderRadius: "16px 16px 0 0",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <h5
                  className="modal-title"
                  style={{ color: "#0f172a", fontWeight: 600 }}
                >
                  Create quote
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !busy && setQuoteOpen(false)}
                />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !quoteForm.validUntil ||
                    !isValidDateOnly(quoteForm.validUntil)
                  ) {
                    setError('Please enter a valid "Valid until" date.');
                    return;
                  }
                  if (!isQuoteDateValid) {
                    setError(
                      "Quote date cannot be earlier than the latest existing quote.",
                    );
                    return;
                  }
                  if (
                    quoteForm.totalAmount !== undefined &&
                    quoteForm.totalAmount !== null &&
                    (!Number.isFinite(Number(quoteForm.totalAmount)) ||
                      Number(quoteForm.totalAmount) < 0)
                  ) {
                    setError(
                      "Total amount must be a valid number (0 or more).",
                    );
                    return;
                  }
                  void run(async () => {
                    await createQuote(id, {
                      validUntil: quoteForm.validUntil,
                      totalAmount: quoteForm.totalAmount,
                      currency: quoteForm.currency,
                    });
                    setQuoteOpen(false);
                  });
                }}
              >
                <div className="modal-body">
                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "#0f172a", fontWeight: 600 }}
                    >
                      Valid until
                    </label>
                    <input
                      className={`form-control ${!isQuoteDateValid ? "is-invalid" : ""}`}
                      type="date"
                      value={quoteForm.validUntil}
                      onChange={(e) =>
                        setQuoteForm({
                          ...quoteForm,
                          validUntil: e.target.value,
                        })
                      }
                      min={
                        latestQuoteDate
                          ? latestQuoteDate.toISOString().slice(0, 10)
                          : undefined
                      }
                      required
                    />
                    {!isQuoteDateValid && (
                      <div className="invalid-feedback">
                        Quote date cannot be earlier than the latest existing
                        quote ({latestQuoteDate?.toLocaleDateString()})
                      </div>
                    )}
                    {latestQuoteDate && isQuoteDateValid && (
                      <div className="form-text text-muted">
                        Latest quote date:{" "}
                        {latestQuoteDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "#0f172a", fontWeight: 600 }}
                    >
                      Total amount (optional)
                    </label>
                    <input
                      className="form-control"
                      type="number"
                      min={0}
                      value={quoteForm.totalAmount ?? ""}
                      onChange={(e) =>
                        setQuoteForm({
                          ...quoteForm,
                          totalAmount: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </div>
                <div
                  className="modal-footer"
                  style={{
                    borderTop: "2px solid #e2e8f0",
                    borderRadius: "0 0 16px 16px",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setQuoteOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy || !isQuoteDateValid}
                    title={
                      !isQuoteDateValid
                        ? "Quote date must be equal to or later than the latest existing quote"
                        : ""
                    }
                  >
                    {busy ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {editOpen && canEditOpportunity && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div
              className="modal-content"
              style={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
              }}
            >
              <div
                className="modal-header"
                style={{
                  borderBottom: "2px solid #e2e8f0",
                  borderRadius: "16px 16px 0 0",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <h5
                  className="modal-title"
                  style={{ color: "#0f172a", fontWeight: 600 }}
                >
                  Update Opportunity
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !busy && setEditOpen(false)}
                />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = String(editForm.name ?? "").trim();
                  if (!name) {
                    setError("Opportunity name is required.");
                    return;
                  }
                  if (
                    editForm.amount !== undefined &&
                    editForm.amount !== null &&
                    (!Number.isFinite(Number(editForm.amount)) ||
                      Number(editForm.amount) < 0)
                  ) {
                    setError("Amount must be a valid number (0 or more).");
                    return;
                  }
                  if (editForm.expectedCloseDate) {
                    const d = String(editForm.expectedCloseDate);
                    if (!isValidDateOnly(d)) {
                      setError("Expected close date must be a valid date.");
                      return;
                    }
                    if (isPastDateOnly(d)) {
                      setError("Expected close date cannot be in the past.");
                      return;
                    }
                  }
                  void run(async () => {
                    const payload = buildUpdatePayload(editForm);
                    await updateOpportunity(id, payload);
                    setEditOpen(false);
                  });
                }}
              >
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Name</label>
                      <input
                        className="form-control"
                        value={editForm.name ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Opportunity name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Stage</label>
                      <select
                        className="form-select"
                        value={editForm.stage ?? "prospecting"}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            stage: e.target.value as OpportunityStageApi,
                          }))
                        }
                      >
                        {(
                          Object.keys(STAGE_LABELS) as OpportunityStageApi[]
                        ).map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editForm.amount ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            amount:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Expected Close Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={editForm.expectedCloseDate ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            expectedCloseDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Type</label>
                      <input
                        className="form-control"
                        value={editForm.type ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, type: e.target.value }))
                        }
                        placeholder="Type"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Source</label>
                      <input
                        className="form-control"
                        value={editForm.source ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, source: e.target.value }))
                        }
                        placeholder="Source"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Next Step
                      </label>
                      <input
                        className="form-control"
                        value={editForm.nextStep ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            nextStep: e.target.value,
                          }))
                        }
                        placeholder="Next step"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Description
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editForm.description ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Description"
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="modal-footer"
                  style={{
                    borderTop: "2px solid #e2e8f0",
                    borderRadius: "0 0 16px 16px",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* CSS Styles - voting/meetings theme */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }

        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .opportunity-details-page .card-header {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-image: none !important;
        }

        .opportunity-details-page .card {
          animation: fadeUpIn 320ms ease-out;
        }

        .opportunity-details-page .card:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14) !important;
          border-color: rgba(14, 165, 233, 0.35) !important;
        }

        .opportunity-details-page .table tbody tr {
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .opportunity-details-page .table tbody tr:hover {
          background-color: #f8fbff;
        }

        .opportunity-details-page .btn {
          border-radius: 10px !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
          padding: 0.5rem 1rem !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: none !important;
          position: relative;
          overflow: hidden;
        }

        .opportunity-details-page .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .opportunity-details-page .btn:hover::before {
          left: 100%;
        }

        .opportunity-details-page .btn-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3) !important;
        }

        .opportunity-details-page .btn-primary:hover {
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(6, 182, 212, 0.4) !important;
          color: #ffffff !important;
        }        .opportunity-details-page .btn-outline-primary {
          border: 1.5px solid rgba(14, 165, 233, 0.45) !important;
          color: #0284c7 !important;
          background: rgba(14, 165, 233, 0.08) !important;
          box-shadow: 0 2px 10px rgba(14, 165, 233, 0.12) !important;
          backdrop-filter: blur(10px) !important;
        }

        .opportunity-details-page .btn-outline-primary:hover {
          background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%) !important;
          color: #ffffff !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 24px rgba(14, 165, 233, 0.35) !important;
        }

        .opportunity-details-page .btn-outline-secondary {
          border: 1.5px solid rgba(99, 102, 241, 0.35) !important;
          color: #4f46e5 !important;
          background: rgba(99, 102, 241, 0.07) !important;
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.1) !important;
          backdrop-filter: blur(10px) !important;
        }

        .opportunity-details-page .btn-outline-secondary:hover {
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%) !important;
          color: #ffffff !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 24px rgba(99, 102, 241, 0.35) !important;
        }

        .opportunity-details-page .btn-outline-dark {
          border: 1.5px solid rgba(100, 116, 139, 0.45) !important;
          color: #475569 !important;
          background: rgba(100, 116, 139, 0.08) !important;
          box-shadow: 0 2px 10px rgba(100, 116, 139, 0.12) !important;
          backdrop-filter: blur(10px) !important;
        }

        .opportunity-details-page .btn-outline-dark:hover {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
          color: #ffffff !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 24px rgba(71, 85, 105, 0.35) !important;
        }

        .opportunity-details-page .form-control,
        .opportunity-details-page .form-select {
          border: 2px solid #e2e8f0 !important;
          border-radius: 12px !important;
          padding: 0.75rem 1rem !important;
          font-size: 0.95rem !important;
          transition: all 0.3s ease !important;
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(10px) !important;
        }

        .opportunity-details-page .form-control:focus,
        .opportunity-details-page .form-select:focus {
          border-color: #06b6d4 !important;
          box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1) !important;
          background: rgba(255, 255, 255, 1) !important;
        }

        .opportunity-details-page .spinner-border {
          color: #06b6d4 !important;
        }
      `}</style>
    </div>
  );
}
