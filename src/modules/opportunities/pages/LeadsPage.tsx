import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  convertLeadToOpportunity,
  createLead,
  deleteLead,
  getLeads,
  qualifyLead,
} from '../api/opportunityApi';
import type { ConvertLeadDto, CreateLeadDto, Lead, LeadSource } from '../types/opportunity.types';
import { isLeadQualifiedForConvert } from '../utils/opportunityFlow';
import './LeadsPage.css';

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold call' },
  { value: 'social_media', label: 'Social media' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

function statusBadgeClass(status: string | undefined): string {
  const s = String(status ?? '').toUpperCase();
  switch (s) {
    case 'NEW':
      return 'bg-info';
    case 'CONTACTED':
      return 'bg-primary';
    case 'QUALIFIED':
      return 'bg-success';
    case 'UNQUALIFIED':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLeadDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    source: 'website',
    estimatedValue: undefined,
    notes: '',
  });

  const [qualifyModalOpen, setQualifyModalOpen] = useState(false);
  const [qualifyLeadId, setQualifyLeadId] = useState<string | null>(null);
  const [qualifyNotes, setQualifyNotes] = useState('');

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertLeadDto>({
    opportunityName: '',
    amount: 0,
    expectedCloseDate: new Date().toISOString().slice(0, 10),
    stage: 'prospecting',
    conversionReason: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, []);

  const resetAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();
    try {
      setActionLoading(true);
      const payload: CreateLeadDto = {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email || undefined,
        phone: createForm.phone || undefined,
        company: createForm.company || undefined,
        title: createForm.title || undefined,
        source: createForm.source,
        estimatedValue:
          createForm.estimatedValue !== undefined && createForm.estimatedValue !== null
            ? Number(createForm.estimatedValue)
            : undefined,
        notes: createForm.notes || undefined,
      };
      await createLead(payload);
      setCreating(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        title: '',
        source: 'website',
        estimatedValue: undefined,
        notes: '',
      });
      setSuccess('Lead created successfully.');
      await loadLeads();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create lead.');
    } finally {
      setActionLoading(false);
    }
  };

  const openQualify = (lead: Lead) => {
    resetAlerts();
    setQualifyLeadId(lead.id);
    setQualifyNotes('');
    setQualifyModalOpen(true);
  };

  const handleQualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qualifyLeadId) return;
    resetAlerts();
    try {
      setActionLoading(true);
      await qualifyLead(qualifyLeadId, { notes: qualifyNotes || undefined });
      setQualifyModalOpen(false);
      setQualifyLeadId(null);
      setSuccess('Lead qualified successfully.');
      await loadLeads();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to qualify lead.');
    } finally {
      setActionLoading(false);
    }
  };

  const openConvert = (lead: Lead) => {
    resetAlerts();
    setConvertLeadId(lead.id);
    setConvertForm({
      opportunityName: `${lead.company ?? ''} ${lead.firstName} ${lead.lastName}`.trim(),
      amount: lead.estimatedValue ?? 0,
      expectedCloseDate: new Date().toISOString().slice(0, 10),
      stage: 'prospecting',
      conversionReason: '',
    });
    setConvertModalOpen(true);
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLeadId) return;
    resetAlerts();
    try {
      setActionLoading(true);
      await convertLeadToOpportunity(convertLeadId, {
        ...convertForm,
        amount: Number(convertForm.amount) || 0,
        conversionReason: convertForm.conversionReason || undefined,
      });
      setConvertModalOpen(false);
      setConvertLeadId(null);
      setSuccess('Lead converted to opportunity successfully.');
      await loadLeads();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to convert lead.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (lead: Lead) => {
    const confirmed = window.confirm(
      `Delete lead "${lead.firstName} ${lead.lastName}"?`,
    );
    if (!confirmed) return;
    resetAlerts();
    try {
      setActionLoading(true);
      await deleteLead(lead.id);
      setSuccess('Lead deleted successfully.');
      await loadLeads();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 leads-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            }}
          >
            <i className="bi bi-people text-white fs-4" />
          </div>
          <div>
            <h2 className="mb-1 fw-bold text-dark">Leads</h2>
            <p className="text-muted mb-0">
              Qualify leads (OpenAPI: PATCH …/qualify with notes), then convert when qualified.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to="/dashboard/opportunities" className="btn btn-outline-secondary btn-lg">
            <i className="bi bi-graph-up-arrow me-2" />
            Opportunities
          </Link>
          <button
            type="button"
            className="btn btn-meetings-primary btn-lg"
            onClick={() => setCreating(true)}
          >
            <i className="bi bi-person-plus me-2" />
            New Lead
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger border-0 shadow-sm mb-3">{error}</div>}
      {success && (
        <div className="alert alert-success border-0 shadow-sm mb-3">
          {success}
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Close"
            onClick={() => setSuccess(null)}
          />
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1 fw-bold text-dark">Lead List</h5>
            <small className="text-muted">Total leads: {leads.length}</small>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="text-muted mb-0">Loading leads...</p>
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="text-muted mb-2">No leads yet</h5>
              <button
                type="button"
                className="btn btn-meetings-primary btn-lg"
                onClick={() => setCreating(true)}
              >
                Create Lead
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Lead</th>
                    <th>Status</th>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Source</th>
                    <th className="text-end lead-actions-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const canConvert = isLeadQualifiedForConvert(lead);
                    return (
                      <tr key={lead.id}>
                        <td>
                          <div className="fw-semibold text-dark">
                            {lead.firstName} {lead.lastName}
                          </div>
                          <small className="text-muted">{lead.title ?? lead.jobTitle ?? '—'}</small>
                        </td>
                        <td>
                          <span className={`badge ${statusBadgeClass(lead.status)} px-3 py-2`}>
                            {lead.status ?? '—'}
                          </span>
                          {lead.isQualified === true && (
                            <span className="badge bg-success ms-1">Qualified</span>
                          )}
                        </td>
                        <td>
                          <div>{lead.email ?? '—'}</div>
                          {lead.phone && <small className="text-muted d-block">{lead.phone}</small>}
                        </td>
                        <td>{lead.company || '—'}</td>
                        <td>{lead.source || '—'}</td>
                        <td className="lead-actions-cell">
                          <div
                            className="lead-actions-bar"
                            role="toolbar"
                            aria-label={`Actions for ${lead.firstName} ${lead.lastName}`}
                          >
                            <button
                              type="button"
                              className="lead-action-btn lead-action-btn--qualify"
                              onClick={() => openQualify(lead)}
                              disabled={actionLoading}
                              title="Qualify lead"
                              aria-label="Qualify lead"
                            >
                              <i className="bi bi-patch-check" aria-hidden />
                              <span className="visually-hidden">Qualify</span>
                            </button>
                            <button
                              type="button"
                              className="lead-action-btn lead-action-btn--convert"
                              onClick={() => openConvert(lead)}
                              disabled={actionLoading || !canConvert}
                              title={
                                !canConvert
                                  ? 'Qualify the lead first, then convert to opportunity'
                                  : 'Convert to opportunity'
                              }
                              aria-label="Convert to opportunity"
                            >
                              <i className="bi bi-box-arrow-up-right" aria-hidden />
                              <span className="visually-hidden">Convert</span>
                            </button>
                            <button
                              type="button"
                              className="lead-action-btn lead-action-btn--delete"
                              onClick={() => handleDelete(lead)}
                              disabled={actionLoading}
                              title="Delete lead"
                              aria-label="Delete lead"
                            >
                              <i className="bi bi-trash" aria-hidden />
                              <span className="visually-hidden">Delete</span>
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
      </div>

      {creating && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Lead</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !actionLoading && setCreating(false)}
                />
              </div>
              <form onSubmit={handleCreateLead}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">First name *</label>
                      <input
                        className="form-control"
                        value={createForm.firstName}
                        onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Last name *</label>
                      <input
                        className="form-control"
                        value={createForm.lastName}
                        onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={createForm.email ?? ''}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone</label>
                      <input
                        className="form-control"
                        value={createForm.phone ?? ''}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Company</label>
                      <input
                        className="form-control"
                        value={createForm.company ?? ''}
                        onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Job title</label>
                      <input
                        className="form-control"
                        value={createForm.title ?? ''}
                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Source</label>
                      <select
                        className="form-select"
                        value={createForm.source}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, source: e.target.value as LeadSource })
                        }
                      >
                        {SOURCE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Estimated value</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        value={createForm.estimatedValue ?? ''}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            estimatedValue: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Notes</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={createForm.notes ?? ''}
                        onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
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
                    {actionLoading ? 'Saving...' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {qualifyModalOpen && qualifyLeadId && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Qualify lead</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !actionLoading && setQualifyModalOpen(false)}
                />
              </div>
              <form onSubmit={handleQualify}>
                <div className="modal-body">
                  <label className="form-label">Notes (optional, BANT)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={qualifyNotes}
                    onChange={(e) => setQualifyNotes(e.target.value)}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => !actionLoading && setQualifyModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-meetings-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Submit qualification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {convertModalOpen && convertLeadId && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Convert to opportunity</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !actionLoading && setConvertModalOpen(false)}
                />
              </div>
              <form onSubmit={handleConvert}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Opportunity name *</label>
                    <input
                      className="form-control"
                      required
                      value={convertForm.opportunityName}
                      onChange={(e) =>
                        setConvertForm({ ...convertForm, opportunityName: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Amount *</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      required
                      value={convertForm.amount}
                      onChange={(e) =>
                        setConvertForm({ ...convertForm, amount: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Expected close date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={convertForm.expectedCloseDate}
                      onChange={(e) =>
                        setConvertForm({ ...convertForm, expectedCloseDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Initial stage</label>
                    <select
                      className="form-select"
                      value={convertForm.stage}
                      onChange={(e) =>
                        setConvertForm({
                          ...convertForm,
                          stage: e.target.value as ConvertLeadDto['stage'],
                        })
                      }
                    >
                      <option value="prospecting">Prospecting</option>
                      <option value="qualification">Qualification</option>
                      <option value="needs_analysis">Needs analysis</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                    </select>
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-semibold">Conversion reason</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={convertForm.conversionReason ?? ''}
                      onChange={(e) =>
                        setConvertForm({ ...convertForm, conversionReason: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => !actionLoading && setConvertModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-meetings-primary" disabled={actionLoading}>
                    {actionLoading ? 'Converting...' : 'Convert'}
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
