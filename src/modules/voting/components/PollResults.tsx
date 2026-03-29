import type { PollResults as PollResultsType } from '../types/voting.types';

interface PollResultsProps {
  results: PollResultsType;
}

function asText(value: unknown): string {
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
}

export function PollResults({ results }: PollResultsProps) {
  const totalVotes = results?.totalVotes;
  const options = results?.options ?? [];

  return (
    <div className="poll-results">
      <h6 className="mb-3">Results</h6>
      <p className="text-muted mb-3">
        <strong>Total votes:</strong> {asText(totalVotes)}
      </p>
      {options.length === 0 ? (
        <p className="text-muted">No votes yet.</p>
      ) : (
        <ul className="list-group list-group-flush">
          {options.map((opt) => {
            const obj = opt as unknown as Record<string, unknown>;
            const rawTitle = obj.optionTitle ?? obj.option ?? obj.optionText;
            const label = asText(rawTitle);

            return (
              <li
                key={opt.pollOptionId}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{label}</span>
                <span>
                  {asText(opt.voteCount)} vote{Number(opt.voteCount) !== 1 ? 's' : ''} (
                  {typeof opt.percentage === 'number' ? opt.percentage.toFixed(1) : asText(opt.percentage)}%)
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
