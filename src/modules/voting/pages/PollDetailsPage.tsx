import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  fetchPoll,
  fetchPollOptions,
  fetchEligibility,
  fetchPollResults,
  activatePoll,
  closePoll,
} from '../api/votingApi';
import { PollOptions } from '../components/PollOptions';
import { PollEligibilityComponent } from '../components/PollEligibility';
import { PollResults } from '../components/PollResults';
import type { Poll, PollOption, PollEligibility, PollResults as PollResultsType } from '../types/voting.types';

type TabId = 'overview' | 'options' | 'eligibility' | 'vote' | 'results';

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

export function PollDetailsPage() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [eligibility, setEligibility] = useState<PollEligibility[]>([]);
  const [results, setResults] = useState<PollResultsType | null>(null);
  const location = useLocation();
  const initialTab = (location.state as { tab?: TabId })?.tab ?? 'overview';
  const [tab, setTab] = useState<TabId>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const loadPoll = async () => {
    if (!pollId) return;
    try {
      const p = await fetchPoll(pollId);
      setPoll(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load poll');
    }
  };

  const loadOptions = async (addedOption?: PollOption) => {
    if (addedOption) {
      setOptions((prev) => [...prev, addedOption]);
      return;
    }
    if (!pollId) return;
    try {
      const { options: opts } = await fetchPollOptions(pollId);
      setOptions(opts ?? []);
    } catch {
      setOptions([]);
    }
  };

  const loadEligibility = async () => {
    if (!pollId) return;
    try {
      const { eligibility: elig } = await fetchEligibility(pollId);
      setEligibility(elig ?? []);
    } catch {
      setEligibility([]);
    }
  };

  const loadResults = async () => {
    if (!pollId) return;
    try {
      const r = await fetchPollResults(pollId);
      setResults(r);
    } catch {
      setResults(null);
    }
  };

  const loadAll = async () => {
    if (!pollId) return;
    setLoading(true);
    setError(null);
    await loadPoll();
    await loadOptions();
    await loadEligibility();
    setResults(null);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [pollId]);

  useEffect(() => {
    if (tab === 'options') loadOptions();
    if (tab === 'eligibility') loadEligibility();
    if (tab === 'results') loadResults();
  }, [tab, pollId]);

  const handleActivate = async () => {
    if (!pollId || !poll) return;
    setStatusLoading(true);
    try {
      await activatePoll(pollId);
      setPoll((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to activate');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleClose = async () => {
    if (!pollId || !poll) return;
    setStatusLoading(true);
    try {
      await closePoll(pollId);
      setPoll((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
      loadResults();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to close');
    } finally {
      setStatusLoading(false);
    }
  };

  if (!pollId) return null;
  if (loading && !poll) return <div className="container-fluid py-3"><p className="text-muted">Loading…</p></div>;
  if (error && !poll) {
    return (
      <div className="container-fluid py-3">
        <div className="alert alert-danger" role="alert">{error}</div>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/voting')}>
          Back to Voting
        </button>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'options', label: 'Options' },
    { id: 'eligibility', label: 'Eligibility' },
    { id: 'vote', label: 'Vote' },
    { id: 'results', label: 'Results' },
  ];

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 className="mb-1">{poll ? asText((poll as any).title) : 'Poll'}</h2>
          {poll?.description && (
            <p className="text-muted mb-0">{asText((poll as any).description)}</p>
          )}
          {poll && (
            <span className={`badge mt-2 ${asText((poll as Record<string, unknown>).status).toUpperCase() === 'DRAFT' ? 'bg-secondary' : asText((poll as Record<string, unknown>).status).toUpperCase() === 'ACTIVE' ? 'bg-success' : 'bg-dark'}`}>
              {asText((poll as Record<string, unknown>).status)}
            </span>
          )}
        </div>
        <div className="d-flex gap-2">
          {poll && asText((poll as Record<string, unknown>).status).toUpperCase() === 'DRAFT' && (
            <button type="button" className="btn btn-success" onClick={handleActivate} disabled={statusLoading}>
              Activate
            </button>
          )}
          {poll && asText((poll as Record<string, unknown>).status).toUpperCase() === 'ACTIVE' && (
            <button type="button" className="btn btn-outline-dark" onClick={handleClose} disabled={statusLoading}>
              Close poll
            </button>
          )}
          <Link to="/voting" className="btn btn-outline-secondary">Back to list</Link>
        </div>
      </div>
      {error && (
        <div className="alert alert-warning mb-3" role="alert">{error}</div>
      )}
      <ul className="nav nav-tabs mb-3">
        {tabs.map((t) => (
          <li key={t.id} className="nav-item">
            <button
              type="button"
              className={`nav-link ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="card">
        <div className="card-body">
          {tab === 'overview' && (
            <div>
              <p><strong>Status:</strong> {poll ? asText((poll as Record<string, unknown>).status) : ''}</p>
              <p><strong>Created:</strong> {poll?.createdAt ? new Date(poll.createdAt).toLocaleString() : '-'}</p>
              <p><strong>Options:</strong> {options.length}</p>
              <p><strong>Eligibility rules:</strong> {eligibility.length}</p>
            </div>
          )}
          {tab === 'options' && (
            <PollOptions
              pollId={pollId}
              options={options}
              onOptionsChange={loadOptions}
              readOnly={poll ? asText((poll as Record<string, unknown>).status).toUpperCase() === 'CLOSED' : false}
            />
          )}
          {tab === 'eligibility' && (
            <PollEligibilityComponent
              pollId={pollId}
              eligibility={eligibility}
              onEligibilityChange={loadEligibility}
              readOnly={poll ? asText((poll as Record<string, unknown>).status).toUpperCase() === 'CLOSED' : false}
            />
          )}
          {tab === 'vote' && (
            <div>
              {poll && asText((poll as Record<string, unknown>).status).toUpperCase() === 'ACTIVE' ? (
                <Link to={`/voting/${pollId}/vote`} className="btn btn-primary">
                  Go to vote
                </Link>
              ) : (
                <p className="text-muted">Voting is only available for active polls.</p>
              )}
            </div>
          )}
          {tab === 'results' && (
            results ? (
              <PollResults results={results} />
            ) : (
              <p className="text-muted">No results yet.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
