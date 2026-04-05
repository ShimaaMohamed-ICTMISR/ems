import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { RootState } from '../../../store/store';
import { fetchPolls } from '../api/votingApi';
import { PollCard } from '../components/PollCard';
import type { Poll } from '../types/voting.types';
import '../styles/voting.css';

export function PollsDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setPolls([]);
        setError('Sign in to view your polls.');
        return;
      }
      const { polls: data } = await fetchPolls(user.id);
      setPolls(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
    <div className="voting-page">
      <div className="container-fluid py-3">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
          <div>
            <h2 className="mb-1">
              <i className="bi bi-bar-chart me-2" style={{ color: '#06b6d4' }}></i>
              Voting & Polls
            </h2>
            <p className="text-muted mb-0">Create and manage polls for team decisions</p>
          </div>
          <Link to="/dashboard/voting/create" className="btn btn-primary btn-lg">
            <i className="bi bi-plus-lg me-2" />
            Create New Poll
          </Link>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border mb-3" style={{ color: '#06b6d4' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="card">
            <div className="card-body text-center text-muted py-5">
              <i className="bi bi-bar-chart display-1 mb-3" style={{ color: '#cbd5e1' }}></i>
              <h4 className="mb-3">No polls yet</h4>
              <p className="mb-4">Get started by creating your first poll to gather team feedback and make decisions together.</p>
              <Link to="/dashboard/voting/create" className="btn btn-primary btn-lg">
                <i className="bi bi-plus-lg me-2" />
                Create Your First Poll
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
    </div>
  );
}
