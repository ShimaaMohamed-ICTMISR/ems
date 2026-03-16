import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Poll, PollStatus } from '../types/voting.types';
import { activatePoll, closePoll, deletePoll } from '../api/votingApi';

interface PollCardProps {
  poll: Poll;
  onStatusChange?: () => void;
}

const statusBadge: Record<PollStatus, string> = {
  DRAFT: 'bg-secondary',
  ACTIVE: 'bg-success',
  CLOSED: 'bg-dark',
};

const statusLabel: Record<PollStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: 'medium',
    });
  } catch {
    return iso;
  }
}

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    const v = value as any;
    if (typeof v.name === 'string') return v.name;
    if (typeof v.title === 'string') return v.title;
    if (typeof v.id === 'string' || typeof v.id === 'number') return String(v.id);
    return JSON.stringify(value);
  }
  return String(value);
}

export function PollCard({ poll, onStatusChange }: PollCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();
  const statusStr = asText((poll as unknown as Record<string, unknown>).status);
  const statusClass = statusBadge[statusStr as PollStatus] ?? 'bg-secondary';
  const statusText = statusLabel[statusStr as PollStatus] ?? statusStr;

  const handleActivate = async () => {
    try {
      await activatePoll(poll.id);
      onStatusChange?.();
    } catch {
      // parent can show error via toast or state
    }
  };

  const handleClose = async () => {
    try {
      await closePoll(poll.id);
      onStatusChange?.();
    } catch {
      // parent can show error via toast or state
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete poll "${asText((poll as any).title)}"? This cannot be undone.`)) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deletePoll(poll.id);
      onStatusChange?.();
      navigate('/voting');
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete poll');
    } finally {
      setDeleting(false);
    }
  };

  const btnClass = 'btn btn-sm rounded-2 px-3';

  return (
    <div className="card h-100 shadow-sm border-0 rounded-3">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
          <Link
            to={`/voting/${poll.id}`}
            className="card-title mb-0 text-decoration-none text-dark fw-semibold flex-grow-1"
            style={{ fontSize: '1rem' }}
          >
            {asText((poll as any).title)}
          </Link>
          <span className={`badge rounded-pill ${statusClass} text-uppercase`} style={{ fontSize: '0.7rem' }}>
            {statusText}
          </span>
        </div>
        {(poll as any).description && (
          <p className="card-text text-muted small flex-grow-1 mb-2" style={{ lineHeight: 1.4 }}>
            {asText((poll as any).description)}
          </p>
        )}
        <p className="text-muted small mb-3">
          <i className="bi bi-calendar3 me-1" />
          {formatDate(poll.createdAt)}
        </p>
        {deleteError && (
          <div className="alert alert-danger py-2 small mb-2" role="alert">
            {deleteError}
          </div>
        )}
        <div className="mt-auto pt-2">
          {statusStr.toUpperCase() === 'DRAFT' && (
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Link to={`/voting/${poll.id}`} className={`${btnClass} btn-outline-primary`}>
                Edit
              </Link>
              <button type="button" className={`${btnClass} btn-success`} onClick={handleActivate}>
                Activate
              </button>
              <button
                type="button"
                className={`${btnClass} btn-outline-danger`}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '…' : 'Delete'}
              </button>
            </div>
          )}
          {statusStr.toUpperCase() === 'ACTIVE' && (
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Link to={`/voting/${poll.id}/vote`} className={`${btnClass} btn-primary`}>
                Vote
              </Link>
              <Link to={`/voting/${poll.id}/results`} className={`${btnClass} btn-outline-secondary`}>
                Results
              </Link>
              <button type="button" className={`${btnClass} btn-outline-dark`} onClick={handleClose}>
                Close
              </button>
            </div>
          )}
          {statusStr.toUpperCase() === 'CLOSED' && (
            <div className="d-flex justify-content-center">
              <Link to={`/voting/${poll.id}/results`} className={`${btnClass} btn-primary`}>
                View Results
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
