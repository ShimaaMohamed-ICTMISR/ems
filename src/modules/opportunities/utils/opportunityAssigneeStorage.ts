/**
 * Persist assignee display label across refresh when GET /opportunities/:id
 * does not return fields we can match to HR employees.
 * Cleared when API response successfully resolves a name.
 */
const STORAGE_KEY = 'ems.opportunityAssigneeDisplay.v1';

type StoreShape = Record<string, { label: string; employeeId: string }>;

function readAll(): StoreShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return p && typeof p === 'object' ? (p as StoreShape) : {};
  } catch {
    return {};
  }
}

export function getStoredAssigneeLabel(opportunityId: string): string | null {
  const v = readAll()[opportunityId];
  return v?.label?.trim() ? v.label : null;
}

export function setStoredAssigneeDisplay(
  opportunityId: string,
  employeeId: string,
  label: string,
): void {
  try {
    const all = readAll();
    all[opportunityId] = { employeeId, label: label.trim() || employeeId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredAssigneeDisplay(opportunityId: string): void {
  try {
    const all = readAll();
    delete all[opportunityId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
