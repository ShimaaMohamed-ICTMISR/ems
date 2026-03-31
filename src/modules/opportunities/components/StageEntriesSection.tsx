import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { OpportunityStageEntry } from '../types/opportunity.types';
import { useStageEntries } from '../hooks/useStageEntries';
import { useCreateEntry } from '../hooks/useCreateEntry';
import { useUpdateEntry } from '../hooks/useUpdateEntry';
import { useDeleteEntry } from '../hooks/useDeleteEntry';
import { StageEntryForm } from './StageEntryForm';
import { isOpportunityClosedStage } from '../utils/opportunityFlow';
import type { CreateOpportunityStageEntryDto, UpdateOpportunityStageEntryDto } from '../types/opportunity.types';

function safeHttpUrl(u: string | null | undefined): string | null {
  if (!u?.trim()) return null;
  try {
    const parsed = new URL(u.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
  } catch {
    return null;
  }
  return null;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export function StageEntriesSection({ 
  opportunityId, 
  opportunityStage 
}: { 
  opportunityId: string;
  opportunityStage?: string;
}) {
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useStageEntries(opportunityId);

  /** Do not show skeleton while in error state (e.g. retries would hide the error alert). */
  const showLoadingSkeleton =
    !isError && (isLoading || (isFetching && entries.length === 0));
  const createMut = useCreateEntry(opportunityId);
  const updateMut = useUpdateEntry(opportunityId);
  const deleteMut = useDeleteEntry(opportunityId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OpportunityStageEntry | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (so !== 0) return so;
      const ta = a.meetingAt ? new Date(a.meetingAt).getTime() : 0;
      const tb = b.meetingAt ? new Date(b.meetingAt).getTime() : 0;
      return tb - ta;
    });
  }, [entries]);

  const openCreate = () => {
    setEditing(null);
    setSubmitError(null);
    setFormOpen(true);
  };

  const openEdit = (entry: OpportunityStageEntry) => {
    setEditing(entry);
    setSubmitError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setSubmitError(null);
  };

  const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending;
  const isOpportunityClosed = isOpportunityClosedStage(opportunityStage);

  useEffect(() => {
    if (!formOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [formOpen]);

  const handleDelete = (entry: OpportunityStageEntry) => {
    if (!window.confirm('Delete this stage entry? This cannot be undone.')) return;
    setSubmitError(null);
    deleteMut.mutate(entry.id, {
      onError: (err) => {
        setSubmitError(err instanceof Error ? err.message : 'Delete failed.');
      },
    });
  };

  const onCreate = async (body: CreateOpportunityStageEntryDto) => {
    setSubmitError(null);
    try {
      await createMut.mutateAsync(body);
      closeForm();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to create entry.');
    }
  };

  const onEdit = async (_entry: OpportunityStageEntry, patch: UpdateOpportunityStageEntryDto) => {
    setSubmitError(null);
    try {
      await updateMut.mutateAsync({ entryId: _entry.id, body: patch });
      closeForm();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to update entry.');
    }
  };

  return (
    <div
      className="card mb-4"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        className="card-header border-0 d-flex flex-wrap align-items-center justify-content-between gap-2"
        style={{
          backgroundColor: '#ffffff',
          borderLeft: '4px solid #14b8a6',
          padding: '1rem 1.5rem',
        }}
      >
        <div>
          <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
            <i className="bi bi-journal-text me-2" style={{ color: '#14b8a6' }} />
            Stage Entries
          </h5>
          <small className="text-muted">Activity log — meetings, follow-ups, notes (not pipeline stage)</small>
        </div>
        <button 
          type="button" 
          className="btn btn-primary btn-sm" 
          onClick={openCreate} 
          disabled={busy || isOpportunityClosed}
          title={isOpportunityClosed ? "Cannot add entries to closed opportunities" : "Add new entry"}
        >
          <i className="bi bi-plus-lg me-1" />
          Add Entry
        </button>
      </div>

      <div className="card-body">
        {showLoadingSkeleton && (
          <div className="py-4">
            <p className="small text-muted mb-3 mb-md-2">
              Loading <strong>activity records</strong> for this opportunity (meetings, follow-ups, notes) from server…
            </p>
            <div className="placeholder-glow">
              <span className="placeholder col-12 mb-2" style={{ height: '1.25rem', display: 'block' }} />
              <span className="placeholder col-10 mb-2" style={{ height: '1rem', display: 'block' }} />
              <span className="placeholder col-8" style={{ height: '1rem', display: 'block' }} />
            </div>
            <div className="text-center mt-3">
              <div className="spinner-border spinner-border-sm text-secondary" role="status" />
              <span className="visually-hidden">Loading</span>
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2 mb-0">
            <span>{error instanceof Error ? error.message : 'Failed to load stage entries.'}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted mb-3">No entries yet</p>
            {isOpportunityClosed ? (
              <div className="text-muted">
                <i className="bi bi-lock me-2"></i>
                Cannot add entries to closed opportunities
              </div>
            ) : (
              <button type="button" className="btn btn-primary" onClick={openCreate} disabled={busy}>
                <i className="bi bi-plus-lg me-1" />
                Add Entry
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && sorted.length > 0 && (
          <div className="vstack gap-3">
            {sorted.map((row) => (
              <div key={row.id} className="border rounded-3 p-3 bg-light">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                  <div className="small text-muted">
                    <span className="fw-semibold text-body">Meeting</span>: {formatWhen(row.meetingAt)}
                    {' · '}
                    <span className="fw-semibold text-body">Order</span>: {row.sortOrder ?? 0}
                  </div>
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openEdit(row)}
                      disabled={busy || isOpportunityClosed}
                      title={isOpportunityClosed ? "Cannot edit entries in closed opportunities" : "Edit entry"}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(row)}
                      disabled={busy || isOpportunityClosed}
                      title={isOpportunityClosed ? "Cannot delete entries in closed opportunities" : "Delete entry"}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <dl className="row small mb-0">
                  <Field label="People" value={row.people} />
                  <Field label="Feedback" value={row.feedback} multiline />
                  <Field label="Next step" value={row.nextStep} />
                  <Field label="Actions" value={row.actions} multiline />
                  <Field label="Notes" value={row.notes} multiline />
                  <dt className="col-sm-3">Document</dt>
                  <dd className="col-sm-9 mb-2">
                    {safeHttpUrl(row.documentUrl) ? (
                      <>
                        <a href={safeHttpUrl(row.documentUrl)!} target="_blank" rel="noopener noreferrer">
                          {row.documentName?.trim() ? row.documentName : safeHttpUrl(row.documentUrl)}
                        </a>
                      </>
                    ) : row.documentUrl?.trim() ? (
                      <span>{row.documentUrl}</span>
                    ) : (
                      '—'
                    )}
                  </dd>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen &&
        createPortal(
          <>
            <div
              className="modal-backdrop show"
              style={{ zIndex: 1040 }}
              aria-hidden="true"
              onClick={() => !busy && closeForm()}
            />
            <div
              className="modal show d-block"
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="stage-entry-modal-title"
              style={{ zIndex: 1050 }}
              onClick={(e) => e.target === e.currentTarget && !busy && closeForm()}
            >
              <div
                className="modal-dialog modal-lg modal-dialog-centered mx-2 mx-md-auto"
                style={{ maxWidth: 'min(800px, calc(100vw - 2rem))' }}
              >
                <div
                  className="modal-content shadow-lg border-0"
                  style={{
                    borderRadius: '16px',
                    maxHeight: 'min(90vh, 920px)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div className="modal-header flex-shrink-0 border-bottom">
                    <h5 className="modal-title" id="stage-entry-modal-title">
                      {editing ? 'Edit entry' : 'Add entry'}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={closeForm}
                      disabled={busy}
                    />
                  </div>
                  <div
                    className="modal-body overflow-auto flex-grow-1 px-3 py-3"
                    style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
                  >
                    <StageEntryForm
                      mode={editing ? 'edit' : 'create'}
                      entry={editing ?? undefined}
                      submitting={busy}
                      submitError={submitError}
                      onSubmitCreate={onCreate}
                      onSubmitEdit={onEdit}
                      onCancel={closeForm}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  const t = value?.trim();
  if (!t) return null;
  return (
    <>
      <dt className="col-sm-3">{label}</dt>
      <dd className={multiline ? 'col-sm-9 mb-2 text-break' : 'col-sm-9 mb-2 text-break'}>
        {multiline ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{t}</span>
        ) : (
          <span>{t}</span>
        )}
      </dd>
    </>
  );
}
