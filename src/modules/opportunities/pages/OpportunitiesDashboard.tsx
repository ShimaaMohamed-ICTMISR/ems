import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  assignOpportunity,
  changeStage,
  closeOpportunity,
  createOpportunity,
  getOpportunities,
  type ChangeStagePayload,
  type CloseOpportunityPayload,
  type CreateOpportunityPayload,
  type Opportunity,
  type OpportunityStage,
} from '../api/opportunitiesService';
import {
  isOpportunityClosedStage,
  normalizeStage,
  opportunityDisplayAmount,
  opportunityDisplayName,
} from '../utils/opportunityFlow';
import { useHrEmployees } from '../hooks/useHrEmployees';
import './OpportunitiesDashboard.css';

const STAGE_LABELS: Record<OpportunityStage, string> = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  needs_analysis: 'Needs Analysis',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed – Won',
  closed_lost: 'Closed – Lost',
};

const STAGE_BADGE_CLASS: Record<OpportunityStage, string> = {
  prospecting: 'bg-info',
  qualification: 'bg-primary',
  needs_analysis: 'bg-secondary',
  proposal: 'bg-warning text-dark',
  negotiation: 'bg-dark',
  closed_won: 'bg-success',
  closed_lost: 'bg-danger',
};

const PAGE_SIZE = 10;

export function OpportunitiesDashboard() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateOpportunityPayload>({
    name: '',
    amount: 0,
    stage: 'prospecting',
    expectedCloseDate: new Date().toISOString().slice(0, 10),
    currency: 'USD',
    type: '',
    source: '',
    description: '',
    nextStep: '',
    accountId: '',
  });

  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const [stageForm, setStageForm] = useState<Pick<ChangeStagePayload, 'stage'>>({
    stage: 'prospecting',
  });

  const [assignForm, setAssignForm] = useState<{ userId: string }>({ userId: '' });

  const [closeForm, setCloseForm] = useState<CloseOpportunityPayload>({
    type: 'won',
    reason: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { employees: hrEmployees, loading: hrEmployeesLoading, loadError: hrEmployeesError } =
    useHrEmployees();

  const loadPage = async (targetPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const { items: data, pagination } = await getOpportunities({
        page: targetPage,
        limit: PAGE_SIZE,
      });
      setItems(data);
      setPage(pagination.page);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.total);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage(1);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await createOpportunity({
        ...createForm,
        amount: Number(createForm.amount) || 0,
      });
      setCreating(false);
      setCreateForm((prev) => ({
        ...prev,
        name: '',
        amount: 0,
        description: '',
        nextStep: '',
      }));
      setSuccessMessage('Opportunity created successfully.');
      await loadPage(1);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create opportunity.');
    } finally {
      setActionLoading(false);
    }
  };

  const openStageModal = (opp: Opportunity) => {
    setSelected(opp);
    setStageForm({
      stage: normalizeStage(String(opp.stage)),
    });
    setStageModalOpen(true);
  };

  const openAssignModal = (opp: Opportunity) => {
    setSelected(opp);
    setAssignForm({ userId: '' });
    setAssignModalOpen(true);
  };

  const openCloseModal = (opp: Opportunity) => {
    setSelected(opp);
    setCloseForm({
      type: opp.stage === 'closed_lost' ? 'lost' : 'won',
      reason: '',
    });
    setCloseModalOpen(true);
  };

  const handleChangeStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      setActionLoading(true);
      setError(null);
      await changeStage(selected.id, { stage: stageForm.stage });
      setStageModalOpen(false);
      setSelected(null);
      setSuccessMessage('Stage updated successfully.');
      await loadPage(page);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update stage.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      setActionLoading(true);
      setError(null);
      await assignOpportunity(selected.id, {
        userId: assignForm.userId,
        role: 'owner',
      });
      setAssignModalOpen(false);
      setSelected(null);
      setSuccessMessage('Opportunity assigned successfully.');
      await loadPage(page);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to assign opportunity.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      setActionLoading(true);
      setError(null);
      await closeOpportunity(selected.id, closeForm);
      setCloseModalOpen(false);
      setSelected(null);
      setSuccessMessage('Opportunity closed successfully.');
      await loadPage(page);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to close opportunity.');
    } finally {
      setActionLoading(false);
    }
  };

  const visibleItems = useMemo(() => items, [items]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="container-fluid py-4 opportunities-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            }}
          >
            <i className="bi bi-graph-up-arrow text-white fs-4" />
          </div>
          <div>
            <h2 className="mb-1 fw-bold text-dark">Opportunities</h2>
            <p className="text-muted mb-0">
              Track, assign, and close sales opportunities across your pipeline.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to="/dashboard/opportunities/leads" className="btn btn-outline-secondary btn-lg">
            <i className="bi bi-people me-2" />
            Leads
          </Link>
          <button
            type="button"
            className="btn btn-meetings-primary btn-lg"
            onClick={() => setCreating(true)}
          >
            <i className="bi bi-plus-circle me-2" />
            New Opportunity
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong className="d-block mb-1">There was a problem</strong>
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={() => loadPage(page)}
            >
              <i className="bi bi-arrow-clockwise me-1" />
              Retry
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success border-0 shadow-sm mb-3">
          {successMessage}
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Close"
            onClick={() => setSuccessMessage(null)}
          />
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1 fw-bold text-dark">Opportunity List</h5>
            <small className="text-muted">
              Showing {visibleItems.length} of {totalItems} opportunities
            </small>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div
              className="d-flex justify-content-center align-items-center py-5"
              style={{ minHeight: '200px' }}
            >
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="text-muted mb-0">Loading opportunities...</p>
              </div>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="text-muted mb-2">No opportunities yet</h5>
              <p className="text-muted mb-4">
                Start by creating your first opportunity to track potential revenue.
              </p>
              <button
                type="button"
                className="btn btn-meetings-primary btn-lg"
                onClick={() => setCreating(true)}
              >
                <i className="bi bi-plus-circle me-2" />
                Create Opportunity
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Stage</th>
                    <th>Amount</th>
                    <th>Expected Close</th>
                    <th className="text-end opp-actions-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((opp) => {
                    const st = normalizeStage(String(opp.stage));
                    const closed = isOpportunityClosedStage(String(opp.stage));
                    return (
                    <tr key={opp.id}>
                      <td>
                        <div className="fw-semibold text-dark">{opportunityDisplayName(opp)}</div>
                        {opp.description && (
                          <small className="text-muted d-block text-truncate" style={{ maxWidth: '260px' }}>
                            {opp.description}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${STAGE_BADGE_CLASS[st] ?? 'bg-secondary'} px-3 py-2`}>
                          {STAGE_LABELS[st] ?? st}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold">
                          {opportunityDisplayAmount(opp).toLocaleString()}
                        </div>
                        {opp.type && <small className="text-muted d-block">{opp.type}</small>}
                      </td>
                      <td>
                        {opp.expectedCloseDate
                          ? new Date(opp.expectedCloseDate).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="opp-actions-cell">
                        <div
                          className="opp-actions-bar"
                          role="toolbar"
                          aria-label={`Actions for ${opportunityDisplayName(opp)}`}
                        >
                          <Link
                            to={`/dashboard/opportunities/${opp.id}`}
                            className="opp-action-btn opp-action-btn--view"
                            title="View details"
                            aria-label="View opportunity details"
                          >
                            <i className="bi bi-eye" aria-hidden />
                            <span className="visually-hidden">View</span>
                          </Link>
                          <button
                            type="button"
                            className="opp-action-btn opp-action-btn--stage"
                            disabled={closed}
                            title={
                              closed
                                ? 'Closed — stage cannot be changed'
                                : 'Change pipeline stage'
                            }
                            aria-label="Change stage"
                            onClick={() => openStageModal(opp)}
                          >
                            <i className="bi bi-kanban" aria-hidden />
                            <span className="visually-hidden">Stage</span>
                          </button>
                          <button
                            type="button"
                            className="opp-action-btn opp-action-btn--assign"
                            disabled={closed}
                            title={
                              closed
                                ? 'Closed — cannot reassign'
                                : 'Assign to an employee'
                            }
                            aria-label="Assign opportunity"
                            onClick={() => openAssignModal(opp)}
                          >
                            <i className="bi bi-person-plus" aria-hidden />
                            <span className="visually-hidden">Assign</span>
                          </button>
                          <button
                            type="button"
                            className="opp-action-btn opp-action-btn--close"
                            disabled={closed}
                            title={closed ? 'Already closed' : 'Close opportunity (won / lost)'}
                            aria-label="Close opportunity"
                            onClick={() => openCloseModal(opp)}
                          >
                            <i className="bi bi-flag" aria-hidden />
                            <span className="visually-hidden">Close</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!loading && visibleItems.length > 0 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Page {page} of {totalPages}
            </small>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={!canGoPrev}
                onClick={() => canGoPrev && loadPage(page - 1)}
              >
                <i className="bi bi-chevron-left me-1" />
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={!canGoNext}
                onClick={() => canGoNext && loadPage(page + 1)}
              >
                Next
                <i className="bi bi-chevron-right ms-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Opportunity Modal */}
      {creating && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Opportunity</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !actionLoading && setCreating(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        value={createForm.amount}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, amount: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Currency</label>
                      <input
                        type="text"
                        className="form-control"
                        value={createForm.currency ?? ''}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, currency: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Stage</label>
                      <select
                        className="form-select"
                        value={createForm.stage}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, stage: e.target.value as OpportunityStage })
                        }
                      >
                        {Object.entries(STAGE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Expected Close Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={createForm.expectedCloseDate}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, expectedCloseDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Account ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={createForm.accountId ?? ''}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, accountId: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Type</label>
                      <input
                        type="text"
                        className="form-control"
                        value={createForm.type ?? ''}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, type: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Source</label>
                      <input
                        type="text"
                        className="form-control"
                        value={createForm.source ?? ''}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, source: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={createForm.description ?? ''}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Next Step</label>
                      <input
                        type="text"
                        className="form-control"
                        value={createForm.nextStep ?? ''}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, nextStep: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => !actionLoading && setCreating(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-meetings-primary" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Stage Modal */}
      {stageModalOpen && selected && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-md modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Stage – {opportunityDisplayName(selected)}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !actionLoading && setStageModalOpen(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleChangeStage}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Stage</label>
                    <select
                      className="form-select"
                      value={stageForm.stage}
                      onChange={(e) =>
                        setStageForm({
                          stage: e.target.value as OpportunityStage,
                        })
                      }
                    >
                      {Object.entries(STAGE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => !actionLoading && setStageModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-meetings-primary" disabled={actionLoading}>
                    {actionLoading ? 'Updating...' : 'Update Stage'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModalOpen && selected && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-md modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Assign Opportunity – {opportunityDisplayName(selected)}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !actionLoading && setAssignModalOpen(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleAssign}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Employee</label>
                    {hrEmployeesLoading && (
                      <div className="small text-muted mb-1">Loading employees…</div>
                    )}
                    {hrEmployeesError && (
                      <div className="alert alert-warning py-2 small mb-2">{hrEmployeesError}</div>
                    )}
                    <select
                      className="form-select"
                      value={assignForm.userId}
                      onChange={(e) => setAssignForm({ userId: e.target.value })}
                      required
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
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => !actionLoading && setAssignModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-meetings-primary"
                    disabled={actionLoading || hrEmployeesLoading || !assignForm.userId}
                  >
                    {actionLoading ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {closeModalOpen && selected && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-md modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Close Opportunity – {selected.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !actionLoading && setCloseModalOpen(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleClose}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Result</label>
                    <select
                      className="form-select"
                      value={closeForm.type}
                      onChange={(e) =>
                        setCloseForm({
                          ...closeForm,
                          type: e.target.value as CloseOpportunityPayload['type'],
                        })
                      }
                    >
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-semibold">Reason (optional)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={closeForm.reason ?? ''}
                      onChange={(e) =>
                        setCloseForm({
                          ...closeForm,
                          reason: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => !actionLoading && setCloseModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-meetings-primary" disabled={actionLoading}>
                    {actionLoading ? 'Closing...' : 'Close Opportunity'}
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

