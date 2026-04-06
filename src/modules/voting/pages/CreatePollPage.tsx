import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll } from "../api/votingApi";
import { useVotingPermissions } from "../../../hooks/useVotingPermissions";
import { VOTING_PERMISSION_KEYS } from "../../../config/votingPermissions";
import "../styles/voting.css";

export function CreatePollPage() {
  const navigate = useNavigate();
  const {
    canAny,
    isLoaded: permissionsLoaded,
    isLoading: permissionsLoading,
  } = useVotingPermissions();
  const canCreatePoll = canAny([...VOTING_PERMISSION_KEYS.POLLS.CREATE]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreatePoll) return;
    if (!title.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const poll = await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      navigate(`/dashboard/voting/${poll.id}`, { state: { tab: "options" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  if (!permissionsLoaded || permissionsLoading) {
    return (
      <div className="voting-page">
        <div className="container-fluid py-3">
          <div className="text-center py-5">
            <div
              className="spinner-border mb-3"
              style={{ color: "#06b6d4" }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canCreatePoll) {
    return (
      <div className="voting-page">
        <div className="container-fluid py-3">
          <div className="text-center py-5">
            <div className="mb-4">
              <i className="bi bi-shield-lock display-1 text-warning opacity-75"></i>
            </div>
            <h4 className="text-muted mb-2">Access Restricted</h4>
            <p className="text-muted mb-4">
              You do not currently have permission to create polls. Please
              contact your administrator if you need access.
            </p>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/dashboard/voting")}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Voting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="container-fluid py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-1">
              <i
                className="bi bi-plus-circle me-2"
                style={{ color: "#06b6d4" }}
              ></i>
              Create New Poll
            </h2>
            <p className="text-muted mb-0">
              Set up a new poll to gather team feedback
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/dashboard/voting")}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Polls
          </button>
        </div>

        {error && (
          <div className="alert alert-danger mb-3" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          <div className="card-body p-3">
            <div className="mb-3">
              <label
                htmlFor="create-poll-title"
                className="form-label fw-semibold"
              >
                <i className="bi bi-type me-2" style={{ color: "#06b6d4" }}></i>
                Poll Title <span className="text-danger">*</span>
              </label>
              <input
                id="create-poll-title"
                type="text"
                className="form-control form-control-lg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter a clear and engaging poll title..."
                style={{ borderRadius: "12px", border: "2px solid #e2e8f0" }}
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor="create-poll-desc"
                className="form-label fw-semibold"
              >
                <i
                  className="bi bi-text-paragraph me-2"
                  style={{ color: "#06b6d4" }}
                ></i>
                Description <span className="text-muted">(Optional)</span>
              </label>
              <textarea
                id="create-poll-desc"
                className="form-control"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional context or instructions for voters..."
                style={{ borderRadius: "12px", border: "2px solid #e2e8f0" }}
              />
            </div>

            <div className="d-flex gap-3 pt-2">
              <button
                type="submit"
                className="btn btn-primary btn-lg px-4"
                disabled={loading || !title.trim()}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Creating Poll...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Create Poll
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-lg px-4"
                onClick={() => navigate("/dashboard/voting")}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
