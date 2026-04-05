import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPoll, fetchPollOptions, submitVote, createEligibility } from '../api/votingApi';
import type { Poll, PollOption } from '../types/voting.types';
import '../styles/voting.css';

const TEST_USER_ID = import.meta.env.VITE_TEST_USER_ID as string | undefined;

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.name === 'string') return v.name;
    if (typeof v.title === 'string') return v.title;
    if (typeof v.id === 'string' || typeof v.id === 'number') return String(v.id);
    return JSON.stringify(value);
  }
  return String(value);
}

export interface PollVoteFormProps {
  pollId: string;
  /** Compact layout for notification modal / side panels */
  embedded?: boolean;
  /** Called after a successful vote (embedded: skip navigation to results) */
  onVoteSuccess?: () => void;
  className?: string;
}

export function PollVoteForm({ pollId, embedded = false, onVoteSuccess, className = '' }: PollVoteFormProps) {
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingEligibility, setAddingEligibility] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!pollId) return;
    let cancelled = false;
    setError(null);
    setSuccess(false);
    (async () => {
      try {
        const [p, o] = await Promise.all([fetchPoll(pollId), fetchPollOptions(pollId)]);
        if (!cancelled) {
          setPoll(p);
          setOptions(o.options ?? []);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        if (!cancelled) {
          if (msg === 'POLL_NOT_FOUND') setError('Poll not found.');
          else setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pollId]);

  const handleSubmit = async () => {
    if (!pollId || !selectedId) return;
    setError(null);
    setSubmitting(true);
    try {
      await submitVote(pollId, { pollOptionId: selectedId });
      if (onVoteSuccess) {
        setSuccess(true);
        onVoteSuccess();
      } else {
        navigate(`/dashboard/voting/${pollId}/results`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to submit vote';
      if (msg === 'NOT_ELIGIBLE') setError('You are not eligible to vote in this poll.');
      else if (msg === 'ALREADY_VOTED' || /already.*vot/i.test(msg)) setError('You have already voted in this poll.');
      else setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isNotEligibleError = error != null && /not eligible|NOT_ELIGIBLE|eligibility/i.test(error);

  const handleAddMeAsEligible = async () => {
    if (!pollId || !TEST_USER_ID) return;
    setError(null);
    setAddingEligibility(true);
    try {
      await createEligibility(pollId, { type: 'userId', value: TEST_USER_ID });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add eligibility');
    } finally {
      setAddingEligibility(false);
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-3 ${className}`}>
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted small mb-0 mt-2">Loading poll…</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className={`alert alert-danger py-2 ${className}`} role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    );
  }

  if (success) {
    return (
      <div className={`alert alert-success py-3 ${className}`} role="status">
        <i className="bi bi-check-circle-fill me-2"></i>
        Your vote was recorded. Thank you.
        {!embedded && (
          <button
            type="button"
            className="btn btn-sm btn-outline-success ms-2"
            onClick={() => navigate(`/dashboard/voting/${pollId}/results`)}
          >
            View results
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`poll-vote-form ${embedded ? 'poll-vote-form--embedded' : ''} ${className}`}>
      <h3 className={`fw-semibold ${embedded ? 'h6 mb-2' : 'mb-2'}`}>
        {poll ? asText((poll as unknown as Record<string, unknown>).title) : 'Vote'}
      </h3>
      {poll?.description != null && (
        <p className={`text-muted mb-3 ${embedded ? 'small' : 'mb-4 small'}`}>
          {asText((poll as unknown as Record<string, unknown>).description)}
        </p>
      )}
      {error && (
        <div className="alert alert-danger mb-3 rounded-3" role="alert">
          {error}
          {!embedded && isNotEligibleError && TEST_USER_ID && (
            <div className="mt-2 pt-2 border-top border-danger">
              <p className="mb-2 small">You created this poll. Add yourself as eligible to vote:</p>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-2"
                onClick={handleAddMeAsEligible}
                disabled={addingEligibility}
              >
                {addingEligibility ? 'Adding…' : 'Add me as eligible'}
              </button>
              <span className="ms-2 small text-muted">or</span>
              <Link to={`/dashboard/voting/${pollId}`} state={{ tab: 'eligibility' }} className="btn btn-sm btn-link ms-1">
                Edit eligibility
              </Link>
            </div>
          )}
        </div>
      )}
      {options.length === 0 ? (
        <p className="text-muted small mb-0">No options available to vote on.</p>
      ) : (
        <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${embedded ? '' : ''}`}>
          <div className={`card-body ${embedded ? 'p-3' : 'p-4'}`}>
            <p className="text-muted small text-uppercase fw-semibold mb-3">Choose one option</p>
            <div className="d-flex flex-column gap-2">
              {options.map((opt) => {
                const isSelected = selectedId === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`d-flex align-items-center p-3 rounded-3 border ${
                      isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-light bg-opacity-50'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name={`voteOption-${pollId}`}
                      className="form-check-input flex-shrink-0 me-3"
                      checked={isSelected}
                      onChange={() => setSelectedId(opt.id)}
                    />
                    <span className={isSelected ? 'fw-medium' : ''}>
                      {asText((opt as unknown as Record<string, unknown>).optionText ?? (opt as unknown as Record<string, unknown>).title)}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
              <button
                type="button"
                className="btn btn-primary rounded-2 px-3"
                onClick={handleSubmit}
                disabled={!selectedId || submitting}
              >
                {submitting ? 'Submitting…' : 'Submit vote'}
              </button>
              {!embedded && (
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-2 px-3"
                  onClick={() => navigate(`/dashboard/voting/${pollId}`)}
                >
                  Cancel
                </button>
              )}
              {embedded && (
                <Link to={`/dashboard/voting/${pollId}/vote`} className="btn btn-link btn-sm ms-auto">
                  Open full voting page
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
