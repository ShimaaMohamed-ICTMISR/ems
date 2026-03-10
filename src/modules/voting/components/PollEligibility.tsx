import { useState } from 'react';
import type { PollEligibility } from '../types/voting.types';
import { createEligibility, deleteEligibility } from '../api/votingApi';

interface PollEligibilityProps {
  pollId: string;
  eligibility: PollEligibility[];
  onEligibilityChange: () => void;
  readOnly?: boolean;
}

export function PollEligibilityComponent({
  pollId,
  eligibility,
  onEligibilityChange,
  readOnly = false,
}: PollEligibilityProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newType, setNewType] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = async () => {
    if (!newType.trim() || !newValue.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await createEligibility(pollId, {
        type: newType.trim(),
        value: newValue.trim(),
      });
      setNewType('');
      setNewValue('');
      onEligibilityChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add eligibility');
    } finally {
      setLoading(false);
    }
  };

  const asText = (value: unknown): string => {
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
  };

  const handleDelete = async (eligibilityId: string) => {
    if (!confirm('Remove this eligibility rule?')) return;
    setError(null);
    setLoading(true);
    try {
      await deleteEligibility(pollId, eligibilityId);
      onEligibilityChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poll-eligibility">
      <h6 className="mb-3">Eligibility</h6>
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <ul className="list-group list-group-flush mb-3">
        {eligibility.length === 0 && (
          <li className="list-group-item text-muted">No eligibility rules.</li>
        )}
        {eligibility.map((e) => (
          <li key={e.id} className="list-group-item d-flex align-items-center">
            <span className="me-2">
              <strong>{asText((e as Record<string, unknown>).type)}:</strong> {asText((e as Record<string, unknown>).value)}
            </span>
            {!readOnly && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-auto"
                onClick={() => handleDelete(e.id)}
                disabled={loading}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <div className="border-top pt-3">
          <div className="row g-2">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Type (e.g. role, department)"
                value={newType}
                onChange={(ev) => setNewType(ev.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Value"
                value={newValue}
                onChange={(ev) => setNewValue(ev.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAdd}
                disabled={loading || !newType.trim() || !newValue.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
