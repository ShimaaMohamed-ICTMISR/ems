import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchPolls } from '../api/votingApi';
import { PollCard } from '../components/PollCard';
import type { Poll } from '../types/voting.types';

export function PollsDashboard() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { polls: data } = await fetchPolls();
      setPolls(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch when returning from create with refreshList (so new poll appears)
  useEffect(() => {
    const state = location.state as { refreshList?: boolean } | null;
    if (state?.refreshList) {
      load();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, load]);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Voting</h2>
        <Link to="/voting/create" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" />
          Create poll
        </Link>
      </div>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-muted">Loading polls…</p>
      ) : polls.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <p className="mb-3">No polls yet.</p>
            <Link to="/voting/create" className="btn btn-primary">
              Create your first poll
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {polls.map((poll) => (
            <div key={poll.id} className="col-md-6 col-lg-4">
              <PollCard poll={poll} onStatusChange={load} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
