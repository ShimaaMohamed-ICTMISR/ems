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
import '../styles/voting.css';

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
  if (loading && !poll) return (
    <div className="voting-page">
      <div className="container-fluid py-3">
        <div className="text-center py-5">
          <div className="spinner-border mb-3" style={{ color: '#06b6d4' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading poll details...</p>
        </div>
      </div>
    </div>
  );
  if (error && !poll) {
    return (
      <div className="voting-page">
        <div className="container-fluid py-3">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/dashboard/voting')}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Voting
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'bi-info-circle' },
    { id: 'options', label: 'Options', icon: 'bi-list-ul' },
    { id: 'eligibility', label: 'Eligibility', icon: 'bi-people' },
    { id: 'vote', label: 'Vote', icon: 'bi-check-circle' },
    { id: 'results', label: 'Results', icon: 'bi-bar-chart' },
  ];

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'DRAFT':
        return 'bg-secondary';
      case 'ACTIVE':
        return 'bg-success';
      case 'CLOSED':
        return 'bg-dark';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'DRAFT':
        return 'bi-pencil-square';
      case 'ACTIVE':
        return 'bi-play-circle-fill';
      case 'CLOSED':
        return 'bi-stop-circle-fill';
      default:
        return 'bi-circle';
    }
  };

  return (
    <div className="voting-page">
      <div className="container-fluid py-3">
        {/* Clean Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold text-dark">{poll ? asText((poll as any).title) : 'Poll'}</h2>
            {poll?.description && (
              <p className="text-muted mb-2">{asText((poll as any).description)}</p>
            )}
            {poll && (
              <span className={`badge ${getStatusBadge(asText((poll as any).status))} px-3 py-2`}>
                <i className={`${getStatusIcon(asText((poll as any).status))} me-1`}></i>
                {asText((poll as any).status)}
              </span>
            )}
          </div>
          <div className="d-flex gap-2">
            {poll && asText((poll as any).status).toUpperCase() === 'DRAFT' && (
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={handleActivate} 
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Activating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-fill me-2"></i>
                    Activate
                  </>
                )}
              </button>
            )}
            {poll && asText((poll as any).status).toUpperCase() === 'ACTIVE' && (
              <button 
                type="button" 
                className="btn btn-outline-dark" 
                onClick={handleClose} 
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Closing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-stop-fill me-2"></i>
                    Close Poll
                  </>
                )}
              </button>
            )}
            <Link to="/dashboard/voting" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Back to List
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-warning mb-4" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Simple Navigation Tabs */}
        <div className="mb-4">
          <ul className="nav nav-pills nav-fill">
            {tabs.map((t) => (
              <li key={t.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <i className={`${t.icon} me-2`}></i>
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Clean Content Area */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            {tab === 'overview' && (
              <div>
                <h5 className="mb-4 fw-semibold">Poll Overview</h5>
                <div className="row g-4">
                  <div className="col-md-3">
                    <div className="text-center p-3">
                      <div className="mb-2">
                        <i className={`${getStatusIcon(poll ? asText((poll as any).status) : '')} fs-1`} style={{ color: '#06b6d4' }}></i>
                      </div>
                      <h6 className="fw-semibold">Status</h6>
                      <p className="text-muted mb-0">{poll ? asText((poll as any).status) : ''}</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3">
                      <div className="mb-2">
                        <i className="bi bi-calendar3 fs-1 text-info"></i>
                      </div>
                      <h6 className="fw-semibold">Created</h6>
                      <p className="text-muted mb-0">
                        {poll?.createdAt ? new Date(poll.createdAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3">
                      <div className="mb-2">
                        <i className="bi bi-list-ul fs-1 text-warning"></i>
                      </div>
                      <h6 className="fw-semibold">Options</h6>
                      <p className="text-muted mb-0">{options.length}</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3">
                      <div className="mb-2">
                        <i className="bi bi-people fs-1 text-success"></i>
                      </div>
                      <h6 className="fw-semibold">Eligibility Rules</h6>
                      <p className="text-muted mb-0">{eligibility.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {tab === 'options' && (
              <div>
                <h5 className="mb-4 fw-semibold">
                  <i className="bi bi-list-ul me-2" style={{ color: '#06b6d4' }}></i>
                  Poll Options
                </h5>
                <PollOptions
                  pollId={pollId}
                  options={options}
                  onOptionsChange={loadOptions}
                  readOnly={poll ? asText((poll as any).status).toUpperCase() === 'CLOSED' : false}
                />
              </div>
            )}
            {tab === 'eligibility' && (
              <div>
                <h5 className="mb-4 fw-semibold">
                  <i className="bi bi-people me-2" style={{ color: '#06b6d4' }}></i>
                  Eligibility Rules
                </h5>
                <PollEligibilityComponent
                  pollId={pollId}
                  eligibility={eligibility}
                  onEligibilityChange={loadEligibility}
                  readOnly={poll ? asText((poll as any).status).toUpperCase() === 'CLOSED' : false}
                />
              </div>
            )}
            {tab === 'vote' && (
              <div className="text-center py-5">
                <i className="bi bi-check-circle display-1 mb-4" style={{ color: '#06b6d4' }}></i>
                <h4 className="mb-3">Cast Your Vote</h4>
                {poll && asText((poll as any).status).toUpperCase() === 'ACTIVE' ? (
                  <>
                    <p className="text-muted mb-4">This poll is currently active and accepting votes.</p>
                    <Link to={`/dashboard/voting/${pollId}/vote`} className="btn btn-primary btn-lg px-5">
                      <i className="bi bi-check-circle me-2"></i>
                      Go to Vote
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-muted mb-4">
                      {asText((poll as any).status).toUpperCase() === 'DRAFT' 
                        ? 'This poll is still in draft mode. Activate it to start accepting votes.'
                        : 'This poll has been closed and is no longer accepting votes.'}
                    </p>
                    <button className="btn btn-outline-secondary btn-lg px-5" disabled>
                      <i className="bi bi-x-circle me-2"></i>
                      Voting Not Available
                    </button>
                  </>
                )}
              </div>
            )}
            {tab === 'results' && (
              <div>
                <h5 className="mb-4 fw-semibold">
                  <i className="bi bi-bar-chart me-2" style={{ color: '#06b6d4' }}></i>
                  Poll Results
                </h5>
                {results ? (
                  <PollResults results={results} />
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-bar-chart display-1 text-muted mb-4"></i>
                    <h5 className="text-muted mb-3">No Results Yet</h5>
                    <p className="text-muted">Results will appear here once voting begins.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
