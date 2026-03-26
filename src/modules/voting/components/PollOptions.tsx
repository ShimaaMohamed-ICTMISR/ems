import { useState } from 'react';
import type { PollOption } from '../types/voting.types';
import {
  createPollOption,
  bulkCreatePollOptions,
  updatePollOption,
  deletePollOption,
} from '../api/votingApi';

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.name === 'string') return v.name;
    if (typeof v.title === 'string') return v.title;
    if (typeof v.optionText === 'string') return v.optionText;
    if (typeof v.id === 'string' || typeof v.id === 'number') return String(v.id);
    return JSON.stringify(value);
  }
  return String(value);
}

interface PollOptionsProps {
  pollId: string;
  options: PollOption[];
  onOptionsChange: (addedOption?: PollOption) => void;
  readOnly?: boolean;
}

export function PollOptions({
  pollId,
  options,
  onOptionsChange,
  readOnly = false,
}: PollOptionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const created = await createPollOption(pollId, { title: newTitle.trim() });
      setNewTitle('');
      onOptionsChange(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add option');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      await bulkCreatePollOptions(pollId, {
        options: lines.map((title, i) => ({ title, displayOrder: i })),
      });
      setBulkText('');
      onOptionsChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add options');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (optionId: string) => {
    if (!editTitle.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await updatePollOption(pollId, optionId, { title: editTitle.trim() });
      setEditingId(null);
      setEditTitle('');
      onOptionsChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update option');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (optionId: string) => {
    if (!confirm('Remove this option?')) return;
    setError(null);
    setLoading(true);
    try {
      await deletePollOption(pollId, optionId);
      onOptionsChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete option');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (opt: PollOption) => {
    setEditingId(opt.id);
    const obj = opt as unknown as Record<string, unknown>;
    setEditTitle(asText(obj.optionText ?? obj.title));
  };

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
          <li key={opt.id} className="list-group-item d-flex align-items-center">
            {editingId === opt.id ? (
              <>
                <input
                  type="text"
                  className="form-control form-control-sm me-2"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(opt.id);
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditTitle('');
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
                    setEditTitle('');
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
                {!readOnly && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => startEdit(opt)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(opt.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <div className="border-top pt-3">
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="New option title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
          <div className="mb-2">
            <textarea
              className="form-control form-control-sm"
              rows={3}
              placeholder="Or add multiple (one per line)"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mt-1"
              onClick={handleBulkAdd}
              disabled={loading || !bulkText.trim()}
            >
              Add all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
