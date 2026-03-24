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

export function OpportunityDetailsPage() {  const { id } = useParams<{ id: string }>();
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
    useHrEmployees();  const load = useCallback(async () => {
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
  const eligibleCloseWon = hasApprovedQuote && hasSignedContract;  const stageOptionsForSelect = useMemo(() => {
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
  };  if (!id) {
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
    <div className="opportunity-details-page container-fluid py-4" style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      minHeight: '100vh' 
    }}>
      {/* Header - matching voting/meetings style */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
            }}
          >
            <i className="bi bi-graph-up-arrow text-white fs-4" />
          </div>          <div>
            <Link
              to="/dashboard/opportunities"
              className="btn btn-link text-decoration-none ps-0 mb-2"
              style={{ color: '#06b6d4', fontSize: '0.9rem', fontWeight: '500' }}
            >
              <i className="bi bi-arrow-left me-1" />
              Back to Opportunities
            </Link>
            <h2 className="mb-1 fw-bold" style={{ 
              color: '#0f172a',
              background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {opportunityDisplayName(opp)}
            </h2>
            <p className="mb-0" style={{ color: '#64748b' }}>
              Opportunity details and management
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={closed || busy}
            onClick={() => setStageOpen(true)}
          >
            <i className="bi bi-kanban me-1" />
            Change stage
          </button>          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={closed || busy}
            onClick={() => {
              setAssignForm({ userId: '' });
              setAssignOpen(true);
            }}
          >
            <i className="bi bi-person-plus me-1" />
            Assign
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            disabled={closed || busy}
            onClick={() => setCloseOpen(true)}
          >
            <i className="bi bi-flag me-1" />
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={closed || busy}
            onClick={() => setQuoteOpen(true)}
          >
            <i className="bi bi-plus-circle me-1" />
            New quote
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 mb-3" style={{ borderRadius: '12px' }}>
          <strong>Notice:</strong> {error}
        </div>
      )}      {/* Stage Badge */}
      <div className="mb-4">
        <span 
          className="badge px-3 py-2" 
          style={{ 
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
          }}
        >
          {STAGE_LABELS[stage] ?? stage}
        </span>
      </div>

      <div className="row g-4">
        {/* Overview Card - voting/meetings style */}
        <div className="col-12">
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <div style={{
              content: '',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 50%, #06b6d4 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite'
            }} />            <div className="card-header border-0" style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #06b6d4',
              padding: '1rem 1.5rem'
            }}>
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: '#0f172a' }}>
                  <i className="bi bi-info-circle me-2" style={{ color: '#06b6d4' }} />
                  Overview
                </h5>
                <small style={{ color: '#64748b' }}>Key opportunity metrics and information</small>
              </div>
            </div>
            <div className="card-body" style={{ padding: '1.25rem', position: 'relative', zIndex: 1 }}>
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="text-center p-3" style={{
                    backgroundColor: '#d1fae5',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <i className="bi bi-currency-dollar mb-2" style={{ 
                      fontSize: '1.5rem', 
                      color: '#06b6d4' 
                    }} />
                    <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#64748b' }}>
                      Amount
                    </h6>
                    <h3 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
                      {opportunityDisplayAmount(opp).toLocaleString()}
                    </h3>
                  </div>
                </div>                <div className="col-md-4">
                  <div className="text-center p-3" style={{
                    backgroundColor: '#d1fae5',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <i className="bi bi-calendar-event mb-2" style={{ 
                      fontSize: '1.5rem', 
                      color: '#06b6d4' 
                    }} />
                    <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#64748b' }}>
                      Expected Close
                    </h6>
                    <h4 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
                      {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : '—'}
                    </h4>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3" style={{
                    backgroundColor: '#d1fae5',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <i className="bi bi-person-circle mb-2" style={{ 
                      fontSize: '1.5rem', 
                      color: '#06b6d4' 
                    }} />
                    <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#64748b' }}>
                      Assigned Employee
                    </h6>
                    <h4 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
                      {employeeOverviewLabel}
                    </h4>
                  </div>
                </div>                {opp.description && (
                  <div className="col-12">
                    <div className="mt-3 p-3" style={{ 
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      borderLeft: '4px solid #06b6d4'
                    }}>
                      <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#64748b' }}>
                        <i className="bi bi-file-text me-2" style={{ color: '#06b6d4' }} />
                        Description
                      </h6>
                      <p className="mb-0" style={{ color: '#0f172a', lineHeight: '1.6' }}>
                        {opp.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quotes Card - voting/meetings style */}
        <div className="col-lg-8">
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '1rem'
          }}>            <div style={{
              content: '',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #10b981 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite'
            }} />
            <div className="card-header border-0" style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #10b981',
              padding: '1rem 1.5rem'
            }}>
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: '#0f172a' }}>
                  <i className="bi bi-file-earmark-text me-2" style={{ color: '#10b981' }} />
                  Quotes
                </h5>
                <small style={{ color: '#64748b' }}>Proposals and pricing information</small>
              </div>
            </div>
            <div className="card-body p-0">
              {quotes.length === 0 ? (
                <div className="text-center py-5" style={{ 
                  padding: '2rem 1.5rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                }}>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{
                      width: '64px',
                      height: '64px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                  >
                    <i className="bi bi-file-earmark-plus text-white" style={{ fontSize: '1.5rem' }} />
                  </div>                  <h6 className="mb-2" style={{ color: '#0f172a' }}>No quotes yet</h6>
                  <p className="mb-0" style={{ color: '#64748b', fontSize: '1rem' }}>
                    Create your first quote to start the proposal process.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ color: '#0f172a', fontWeight: '600' }}>ID</th>
                        <th style={{ color: '#0f172a', fontWeight: '600' }}>Amount</th>
                        <th style={{ color: '#0f172a', fontWeight: '600' }}>Valid until</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((q) => (
                        <tr key={q.id}>
                          <td>
                            <code className="small px-2 py-1" style={{
                              backgroundColor: '#f0fdf4',
                              color: '#047857',
                              borderRadius: '6px',
                              fontWeight: '500'
                            }}>
                              {q.id.slice(0, 8)}…
                            </code>
                          </td>
                          <td style={{ color: '#0f172a', fontWeight: '500' }}>
                            {q.totalAmount?.toLocaleString?.() ?? '—'}
                          </td>
                          <td style={{ color: '#64748b' }}>
                            {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>        {/* History Card - voting/meetings style */}
        <div className="col-lg-4">
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <div style={{
              content: '',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #8b5cf6 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite'
            }} />
            <div className="card-header border-0" style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #8b5cf6',
              padding: '1rem 1.5rem'
            }}>
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: '#0f172a' }}>
                  <i className="bi bi-clock-history me-2" style={{ color: '#8b5cf6' }} />
                  History
                </h5>
                <small style={{ color: '#64748b' }}>Activity timeline</small>
              </div>
            </div>            <div className="card-body" style={{ padding: '1.25rem', position: 'relative', zIndex: 1 }}>
              {history.length === 0 ? (
                <div className="text-center py-4" style={{ 
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '12px'
                }}>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{
                      width: '64px',
                      height: '64px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    }}
                  >
                    <i className="bi bi-clock text-white" style={{ fontSize: '1.5rem' }} />
                  </div>
                  <h6 className="mb-2" style={{ color: '#0f172a' }}>No history entries</h6>
                  <p className="mb-0" style={{ color: '#64748b', fontSize: '1rem' }}>
                    Activity history will appear here.
                  </p>
                </div>
              ) : (
                <div>
                  {history.map((h, index) => (
                    <div key={h.id} className="d-flex align-items-start mb-3 pb-3" style={{ 
                      borderBottom: index < history.length - 1 ? '1px solid #f3f4f6' : 'none' 
                    }}>
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ 
                          width: '32px',
                          height: '32px',
                          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                          flexShrink: 0
                        }}
                      >
                        <i className="bi bi-circle-fill text-white" style={{ fontSize: '0.5rem' }}></i>
                      </div>                      <div className="flex-grow-1">
                        <div className="fw-semibold mb-1" style={{ color: '#0f172a' }}>{h.action}</div>
                        <div className="d-flex align-items-center gap-2">
                          <small style={{ color: '#64748b' }}>
                            {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
                          </small>
                          {h.newValue && (
                            <>
                              <span style={{ color: '#d1d5db' }}>•</span>
                              <small 
                                className="px-2 py-1" 
                                style={{ 
                                  backgroundColor: '#f0fdf4',
                                  color: '#047857',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500'
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
      </div>      {/* Modals - voting/meetings style */}
      {stageOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
              backdropFilter: 'blur(20px)'
            }}>
              <div className="modal-header" style={{
                borderBottom: '2px solid #e2e8f0',
                borderRadius: '16px 16px 0 0',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
              }}>
                <h5 className="modal-title" style={{ color: '#0f172a', fontWeight: '600' }}>Change stage</h5>
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
                  <label className="form-label" style={{ color: '#0f172a', fontWeight: '600' }}>
                    <i className="bi bi-kanban me-2" style={{ color: '#06b6d4' }} />
                    Stage
                  </label>
                  <select
                    className="form-select"
                    value={stageForm.stage}
                    onChange={(e) =>
                      setStageForm({ stage: e.target.value as OpportunityStageApi })
                    }
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {stageOptionsForSelect.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>                <div className="modal-footer" style={{
                  borderTop: '2px solid #e2e8f0',
                  borderRadius: '0 0 16px 16px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                }}>
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

      {/* CSS Styles - voting/meetings theme */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }

        .opportunity-details-page .card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12) !important;
          border-color: rgba(8, 145, 178, 0.3) !important;
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
          border: 2px solid #06b6d4 !important;
          color: #06b6d4 !important;
          background: rgba(6, 182, 212, 0.05) !important;
          backdrop-filter: blur(10px) !important;
        }

        .opportunity-details-page .btn-outline-primary:hover {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
          color: #ffffff !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(6, 182, 212, 0.3) !important;
        }

        .opportunity-details-page .btn-outline-secondary {
          border: 2px solid #64748b !important;
          color: #64748b !important;
          background: rgba(100, 116, 139, 0.05) !important;
          backdrop-filter: blur(10px) !important;
        }

        .opportunity-details-page .btn-outline-secondary:hover {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
          color: #ffffff !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(100, 116, 139, 0.3) !important;
        }

        .opportunity-details-page .btn-outline-dark {
          border: 2px solid #374151 !important;
          color: #374151 !important;
          background: rgba(55, 65, 81, 0.05) !important;
          backdrop-filter: blur(10px) !important;
        }

        .opportunity-details-page .btn-outline-dark:hover {
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%) !important;
          color: #ffffff !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(55, 65, 81, 0.3) !important;
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