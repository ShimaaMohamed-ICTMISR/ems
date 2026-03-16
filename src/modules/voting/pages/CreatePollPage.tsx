import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '../api/votingApi';

export function CreatePollPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const poll = await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      navigate(`/voting/${poll.id}`, { state: { tab: 'options' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <h2 className="mb-4">Create poll</h2>
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="create-poll-title" className="form-label">
              Title <span className="text-danger">*</span>
            </label>
            <input
              id="create-poll-title"
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Poll title"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="create-poll-desc" className="form-label">
              Description
            </label>
            <textarea
              id="create-poll-desc"
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !title.trim()}
            >
              {loading ? 'Creating…' : 'Create poll'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate('/dashboard/voting')}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
