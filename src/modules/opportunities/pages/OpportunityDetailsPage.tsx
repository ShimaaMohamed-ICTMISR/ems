import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  assignOpportunity,
  changeOpportunityStage,
  closeOpportunity,
  createQuote,
  getOpportunityById,
  getOpportunityHistory,
  getQuotesForOpportunity,
} from '../api/opportunityApi';
import type {
  ChangeStageDto,
  CloseOpportunityDto,
  CreateQuoteDto,
  Opportunity,
  OpportunityHistory,
  OpportunityStageApi,
  Quote,
} from '../types/opportunity.types';
import {
  hasApprovedQuoteFromList,
  isOpportunityClosedStage,
  normalizeStage,
  opportunityAssigneeDisplayName,
  opportunityDisplayAmount,
  opportunityDisplayName,
} from '../utils/opportunityFlow';
import { useHrEmployees } from '../hooks/useHrEmployees';
import {
  clearStoredAssigneeDisplay,
  getStoredAssigneeLabel,
  setStoredAssigneeDisplay,
} from '../utils/opportunityAssigneeStorage';

const STAGE_LABELS: Record<OpportunityStageApi, string> = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  needs_analysis: 'Needs Analysis',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed – Won',
  closed_lost: 'Closed – Lost',
};

const OPEN_STAGES: OpportunityStageApi[] = [
  'prospecting',
  'qualification',
  'needs_analysis',
  'proposal',
  'negotiation',
];

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

  const [stageForm, setStageForm] = useState<Pick<ChangeStageDto, 'stage'>>({
    stage: 'prospecting',
  });
  const [assignForm, setAssignForm] = useState<{ userId: string }>({ userId: '' });
  /** Shown when API does not echo HR employee id but assign succeeded from this UI */
  const [assigneeLabelOverride, setAssigneeLabelOverride] = useState<string | null>(null);
  const [closeForm, setCloseForm] = useState<CloseOpportunityDto>({
    type: 'won',
    reason: '',
  });
  const [quoteForm, setQuoteForm] = useState<CreateQuoteDto>({
    validUntil: new Date().toISOString().slice(0, 10),
    totalAmount: undefined,
    currency: 'USD',
  });

  const { employees: hrEmployees, loading: hrEmployeesLoading, loadError: hrEmployeesError } =
    useHrEmployees();

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
      setError(e instanceof Error ? e.message : 'Failed to load opportunity.');
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

  const stage = opp ? normalizeStage(String(opp.stage)) : 'prospecting';
  const closed = isOpportunityClosedStage(opp?.stage);
  const approvedFromApi = opp?.hasApprovedQuote === true;
  const approvedFromQuotes = hasApprovedQuoteFromList(quotes);
  const hasApprovedQuote = approvedFromApi || approvedFromQuotes;
  const hasSignedContract = opp?.hasSignedContract === true;
  const eligibleCloseWon = hasApprovedQuote && hasSignedContract;

  const stageOptionsForSelect = useMemo(() => {
    if (closed) return [];
    return OPEN_STAGES.filter((s) => {
      if (s === 'negotiation' && !hasApprovedQuote) return false;
      return true;
    });
  }, [closed, hasApprovedQuote]);

  const employeeOverviewLabel = useMemo(() => {
    if (!opp || !id) return '—';
    const fromApi = opportunityAssigneeDisplayName(opp, hrEmployees);
    if (fromApi !== '—') return fromApi;
    if (assigneeLabelOverride) return assigneeLabelOverride;
    return getStoredAssigneeLabel(id) ?? '—';
  }, [opp, id, hrEmployees, assigneeLabelOverride]);

  /** Drop local cache when API finally returns a resolvable assignee */
  useEffect(() => {
    if (!id || !opp) return;
    if (opportunityAssigneeDisplayName(opp, hrEmployees) !== '—') {
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
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!id) {
    return <div className="p-4">Invalid opportunity.</div>;
  }

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
        <Link to="/dashboard/opportunities" className="btn btn-outline-secondary">
          Back to list
        </Link>
      </div>
    );
  }

  if (!opp) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <Link
            to="/dashboard/opportunities"
            className="btn btn-link text-decoration-none ps-0 mb-2"
          >
            <i className="bi bi-arrow-left me-1" />
            Opportunities
          </Link>
          <h2 className="fw-bold text-dark mb-1">{opportunityDisplayName(opp)}</h2>
          <span className="badge bg-primary">{STAGE_LABELS[stage] ?? stage}</span>
        </div>
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={closed || busy}
            onClick={() => setStageOpen(true)}
          >
            Change stage
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={closed || busy}
            onClick={() => {
              setAssignForm({ userId: '' });
              setAssignOpen(true);
            }}
          >
            Assign
          </button>
          <button
            type="button"
            className="btn btn-outline-success btn-sm"
            disabled={closed || busy}
            onClick={() => setCloseOpen(true)}
          >
            Close won / lost
          </button>
          <button
            type="button"
            className="btn btn-meetings-primary btn-sm"
            disabled={closed || busy}
            onClick={() => setQuoteOpen(true)}
          >
            New quote
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning border-0 mb-3">
          <strong>Notice:</strong> {error}
        </div>
      )}

      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold">Overview</div>
            <div className="card-body row g-3">
              <div className="col-md-4">
                <div className="text-muted small">Amount</div>
                <div className="fw-semibold">
                  {opportunityDisplayAmount(opp).toLocaleString()}
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-muted small">Expected close</div>
                <div>{opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : '—'}</div>
              </div>
              <div className="col-md-4">
                <div className="text-muted small">Employee</div>
                <div className="fw-semibold">{employeeOverviewLabel}</div>
              </div>
              {opp.description && (
                <div className="col-12">
                  <div className="text-muted small">Description</div>
                  <p className="mb-0">{opp.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
              <span>Quotes</span>
            </div>
            <div className="card-body p-0">
              {quotes.length === 0 ? (
                <p className="text-muted p-3 mb-0">No quotes yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Amount</th>
                        <th>Valid until</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((q) => (
                        <tr key={q.id}>
                          <td><code className="small">{q.id.slice(0, 8)}…</code></td>
                          <td>{q.totalAmount?.toLocaleString?.() ?? '—'}</td>
                          <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">History</div>
            <div className="card-body">
              {history.length === 0 ? (
                <p className="text-muted mb-0">No history entries.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {history.map((h) => (
                    <li key={h.id} className="list-group-item px-0">
                      <div className="fw-semibold">{h.action}</div>
                      <small className="text-muted">
                        {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
                        {h.newValue ? ` → ${h.newValue}` : ''}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {stageOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change stage</h5>
                <button type="button" className="btn-close" onClick={() => !busy && setStageOpen(false)} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await changeOpportunityStage(id, { stage: stageForm.stage });
                    setStageOpen(false);
                  });
                }}
              >
                <div className="modal-body">
                  <label className="form-label">Stage</label>
                  <select
                    className="form-select"
                    value={stageForm.stage}
                    onChange={(e) =>
                      setStageForm({ stage: e.target.value as OpportunityStageApi })
                    }
                  >
                    {stageOptionsForSelect.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setStageOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {assignOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Assign Opportunity – {opp ? opportunityDisplayName(opp) : '…'}
                </h5>
                <button type="button" className="btn-close" onClick={() => !busy && setAssignOpen(false)} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    const selectedId = assignForm.userId;
                    await assignOpportunity(id, {
                      userId: selectedId,
                      role: 'owner',
                    });
                    const emp = hrEmployees.find((e) => e.id === selectedId);
                    const label =
                      emp
                        ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.email || emp.id
                        : selectedId;
                    setAssigneeLabelOverride(label);
                    if (id) setStoredAssigneeDisplay(id, selectedId, label);
                    setAssignOpen(false);
                  });
                }}
              >
                <div className="modal-body">
                  <label className="form-label">Employee</label>
                  {hrEmployeesLoading && (
                    <div className="small text-muted mb-1">Loading employees…</div>
                  )}
                  {hrEmployeesError && (
                    <div className="alert alert-warning py-2 small mb-2">{hrEmployeesError}</div>
                  )}
                  <select
                    className="form-select"
                    required
                    value={assignForm.userId}
                    onChange={(e) => setAssignForm({ userId: e.target.value })}
                    disabled={hrEmployeesLoading}
                  >
                    <option value="">Select employee…</option>
                    {hrEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} — {emp.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setAssignOpen(false)}>
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

      {closeOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Close opportunity</h5>
                <button type="button" className="btn-close" onClick={() => !busy && setCloseOpen(false)} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await closeOpportunity(id, closeForm);
                    setCloseOpen(false);
                    navigate('/dashboard/opportunities');
                  });
                }}
              >
                <div className="modal-body">
                  {closeForm.type === 'won' && !eligibleCloseWon && (
                    <div className="alert alert-info small">
                      Backend may reject close won without approved quote and signed contract.
                    </div>
                  )}
                  <label className="form-label">Result</label>
                  <select
                    className="form-select"
                    value={closeForm.type}
                    onChange={(e) =>
                      setCloseForm({ ...closeForm, type: e.target.value as 'won' | 'lost' })
                    }
                  >
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                  <label className="form-label mt-2">Reason (optional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={closeForm.reason ?? ''}
                    onChange={(e) => setCloseForm({ ...closeForm, reason: e.target.value })}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setCloseOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {quoteOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create quote</h5>
                <button type="button" className="btn-close" onClick={() => !busy && setQuoteOpen(false)} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
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
                  <label className="form-label">Valid until *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={quoteForm.validUntil}
                    onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                  />
                  <label className="form-label mt-2">Total amount (optional)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    value={quoteForm.totalAmount ?? ''}
                    onChange={(e) =>
                      setQuoteForm({
                        ...quoteForm,
                        totalAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setQuoteOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
