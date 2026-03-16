import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPoll, fetchPollResults } from '../api/votingApi';
import { PollResults } from '../components/PollResults';
import type { Poll, PollResults as PollResultsType } from '../types/voting.types';

export function ResultsPage() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResultsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pollId) return;
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const [p, r] = await Promise.all([
          fetchPoll(pollId),
          fetchPollResults(pollId),
        ]);
        if (!cancelled) {
          setPoll(p);
          setResults(r);
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

  const formatTitle = (title: unknown): string => {
    if (title == null) return 'Results';
    if (typeof title === 'string' || typeof title === 'number' || typeof title === 'boolean') {
      return String(title);
    }
    if (typeof title === 'object') {
      const t = title as any;
      if (typeof t.name === 'string') return t.name;
      if (typeof t.title === 'string') return t.title;
      if (typeof t.id === 'string' || typeof t.id === 'number') return String(t.id);
      return JSON.stringify(title);
    }
    return String(title);
  };

  if (!pollId) return null;
  if (loading) return <div className="container-fluid py-3"><p className="text-muted">Loading…</p></div>;
  if (error && !poll) {
    return (
      <div className="container-fluid py-3">
        <div className="alert alert-danger" role="alert">{error}</div>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/dashboard/voting')}>
          Back to Voting
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <h2 className="mb-2">{formatTitle(poll ? (poll as any).title : 'Results')}</h2>
      {poll?.description && (
        <p className="text-muted mb-4">
          {formatTitle((poll as any).description)}
        </p>
      )}
      {error && (
        <div className="alert alert-warning mb-3" role="alert">
          {error}
        </div>
      )}
      <div className="card">
        <div className="card-body">
          {results ? (
            <PollResults results={results} />
          ) : (
            <p className="text-muted">No results available.</p>
          )}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-outline-secondary mt-3"
        onClick={() => navigate(`/voting/${pollId}`)}
      >
        Back to poll
      </button>
    </div>
  );
}
