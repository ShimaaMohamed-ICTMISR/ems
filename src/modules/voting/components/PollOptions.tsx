import { useState } from "react";
import type { PollOption } from "../types/voting.types";
import {
  createPollOption,
  updatePollOption,
  deletePollOption,
} from "../api/votingApi";

function asText(value: unknown): string {
  if (value == null) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.name === "string") return v.name;
    if (typeof v.title === "string") return v.title;
    if (typeof v.optionText === "string") return v.optionText;
    if (typeof v.id === "string" || typeof v.id === "number")
      return String(v.id);
    return JSON.stringify(value);
  }
  return String(value);
}

interface PollOptionsProps {
  pollId: string;
  options: PollOption[];
  onOptionsChange: (addedOption?: PollOption) => void;
  readOnly?: boolean;
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function PollOptions({
  pollId,
  options,
  onOptionsChange,
  readOnly = false,
  canView = true,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: PollOptionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAdd = async () => {
    if (!canCreate || readOnly) return;
    if (!newTitle.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const created = await createPollOption(pollId, {
        title: newTitle.trim(),
      });
      setNewTitle("");
      onOptionsChange(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add option");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (optionId: string) => {
    if (!canEdit || readOnly) return;
    if (!editTitle.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await updatePollOption(pollId, optionId, { title: editTitle.trim() });
      setEditingId(null);
      setEditTitle("");
      onOptionsChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update option");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (optionId: string) => {
    if (!canDelete || readOnly) return;
    if (!confirm("Remove this option?")) return;
    setError(null);
    setLoading(true);
    try {
      await deletePollOption(pollId, optionId);
      onOptionsChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete option");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (opt: PollOption) => {
    if (!canEdit || readOnly) return;
    setEditingId(opt.id);
    const obj = opt as unknown as Record<string, unknown>;
    setEditTitle(asText(obj.optionText ?? obj.title));
  };

  if (!canView) {
    return (
      <div className="text-center py-4">
        <div className="mb-3">
          <i className="bi bi-shield-lock fs-2 text-warning opacity-75"></i>
        </div>
        <h6 className="text-muted mb-2">Access Restricted</h6>
        <p className="text-muted mb-0 small">
          You do not currently have permission to view poll options.
        </p>
      </div>
    );
  }

  return (
    <div className="poll-options">
      <h6 className="mb-3">Options</h6>
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <ul className="list-group list-group-flush mb-3">
        {options.length === 0 && (
          <li className="list-group-item text-muted">No options yet.</li>
        )}
        {options.map((opt) => (
          <li
            key={opt.id}
            className="list-group-item d-flex align-items-center"
          >
            {editingId === opt.id ? (
              <>
                <input
                  type="text"
                  className="form-control form-control-sm me-2"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(opt.id);
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditTitle("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary me-1"
                  onClick={() => handleUpdate(opt.id)}
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setEditTitle("");
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-grow-1">
                  {(() => {
                    const obj = opt as unknown as Record<string, unknown>;
                    return asText(obj.optionText ?? obj.title);
                  })()}
                </span>
                {!readOnly && (canEdit || canDelete) && (
                  <>
                    {canEdit && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => startEdit(opt)}
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(opt.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && canCreate && (
        <div className="border-top pt-3">
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="New option title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={loading || !newTitle.trim()}
            >
              Add option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
