import type { Lead } from '../types/opportunity.types';
import type { OpportunityStageApi } from '../types/opportunity.types';

function employeeLabel(e: {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeCode?: string;
}): string {
  const name = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
  return name || e.email || e.employeeCode || e.id;
}

/** Collect possible assignee id strings from flat + nested API shapes (camelCase / PascalCase). */
function collectOpportunityAssigneeIds(opp: object): string[] {
  const o = opp as Record<string, unknown>;
  const flatKeys = [
    'assignedTo',
    'ownerId',
    'accountId',
    'userId',
    'assigneeId',
    'assignedUserId',
    'employeeId',
    'AssignedTo',
    'OwnerId',
    'UserId',
    'AssigneeId',
  ];
  const ids: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v.trim()) ids.push(v.trim());
  };
  for (const k of flatKeys) push(o[k]);

  const nestedKeys = ['assignee', 'owner', 'assignedUser', 'employee', 'Assignee', 'Owner', 'User'];
  for (const k of nestedKeys) {
    const n = o[k];
    if (n && typeof n === 'object') {
      const rec = n as Record<string, unknown>;
      push(rec.id);
      push(rec.userId);
      push(rec.user_id);
    }
  }
  return ids;
}

function collectOpportunityAssigneeNames(opp: object): string[] {
  const o = opp as Record<string, unknown>;
  const keys = [
    'assigneeName',
    'ownerName',
    'assignedToName',
    'AssigneeName',
    'OwnerName',
    'assignedUserName',
  ];
  const out: string[] = [];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) out.push(v.trim());
  }
  return out;
}

/**
 * Resolve assignee label: explicit names from API, then match HR list by id / email / employeeCode.
 */
export function opportunityAssigneeDisplayName(
  opp: object,
  employees: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeCode?: string;
  }[],
): string {
  for (const n of collectOpportunityAssigneeNames(opp)) {
    if (n) return n;
  }

  const byId = new Map<string, string>();
  const byEmail = new Map<string, string>();
  const byCode = new Map<string, string>();
  for (const e of employees) {
    const label = employeeLabel(e);
    byId.set(e.id, label);
    if (e.email?.trim()) byEmail.set(e.email.trim().toLowerCase(), label);
    if (e.employeeCode?.trim()) byCode.set(e.employeeCode.trim(), label);
  }

  for (const id of collectOpportunityAssigneeIds(opp)) {
    if (byId.has(id)) return byId.get(id)!;
    if (byEmail.has(id.toLowerCase())) return byEmail.get(id.toLowerCase())!;
    if (byCode.has(id)) return byCode.get(id)!;
  }

  return '—';
}

export function isLeadQualifiedForConvert(lead: Lead): boolean {
  if (lead.isQualified === true) return true;
  const s = String(lead.status ?? '').toLowerCase();
  return s === 'qualified';
}

export function isOpportunityClosedStage(stage: string | undefined): boolean {
  if (!stage) return false;
  const s = String(stage).toLowerCase().replace(/-/g, '_');
  return s === 'closed_won' || s === 'closed_lost';
}

export function normalizeStage(stage: string | undefined): OpportunityStageApi {
  if (!stage) return 'prospecting';
  const s = String(stage).toLowerCase().replace(/-/g, '_') as OpportunityStageApi;
  const allowed: OpportunityStageApi[] = [
    'prospecting',
    'qualification',
    'needs_analysis',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
  ];
  return allowed.includes(s) ? s : 'prospecting';
}

function coerceNumericAmount(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '') return undefined;
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Best-effort amount from API (camelCase, snake_case, PascalCase, or string numbers).
 */
export function opportunityDisplayAmount(opp: object): number {
  const o = opp as Record<string, unknown>;
  const keys = [
    'amount',
    'expectedValue',
    'expected_value',
    'estimatedValue',
    'estimated_value',
    'value',
    'totalAmount',
    'total_value',
    'Amount',
    'ExpectedValue',
    'EstimatedValue',
    'Value',
    'TotalAmount',
  ];
  for (const k of keys) {
    const n = coerceNumericAmount(o[k]);
    if (n !== undefined) return n;
  }
  return 0;
}

export function opportunityDisplayName(opp: { name?: string; title?: string }): string {
  return (opp.name ?? opp.title ?? '—').toString();
}

/** Heuristic: any quote with APPROVED status */
export function hasApprovedQuoteFromList(
  quotes: { status?: string }[] | undefined,
): boolean {
  if (!quotes?.length) return false;
  return quotes.some((q) => String(q.status).toUpperCase() === 'APPROVED');
}
