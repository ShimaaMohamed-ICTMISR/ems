import type {
  CreateOpportunityStageEntryDto,
  OpportunityStageEntry,
  UpdateOpportunityStageEntryDto,
} from '../types/opportunity.types';

export type StageEntryFormValues = {
  meetingAt: string;
  people: string;
  feedback: string;
  nextStep: string;
  documentUrl: string;
  documentName: string;
  actions: string;
  notes: string;
  sortOrder: number;
};

export function defaultStageEntryFormValues(): StageEntryFormValues {
  return {
    meetingAt: '',
    people: '',
    feedback: '',
    nextStep: '',
    documentUrl: '',
    documentName: '',
    actions: '',
    notes: '',
    sortOrder: 0,
  };
}

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function entryToFormValues(entry: OpportunityStageEntry): StageEntryFormValues {
  return {
    meetingAt: isoToDatetimeLocalValue(entry.meetingAt),
    people: entry.people ?? '',
    feedback: entry.feedback ?? '',
    nextStep: entry.nextStep ?? '',
    documentUrl: entry.documentUrl ?? '',
    documentName: entry.documentName ?? '',
    actions: entry.actions ?? '',
    notes: entry.notes ?? '',
    sortOrder: typeof entry.sortOrder === 'number' && Number.isFinite(entry.sortOrder) ? entry.sortOrder : 0,
  };
}

type NormalizedStage = {
  meetingAtIso: string | null;
  people: string;
  feedback: string;
  nextStep: string;
  documentUrl: string;
  documentName: string;
  actions: string;
  notes: string;
  sortOrder: number;
};

function normalizeFromForm(v: StageEntryFormValues): NormalizedStage {
  let meetingAtIso: string | null = null;
  const raw = v.meetingAt.trim();
  if (raw) {
    const ms = new Date(raw).getTime();
    if (!Number.isNaN(ms)) meetingAtIso = new Date(raw).toISOString();
  }
  const sortOrder = Math.max(0, Math.floor(Number(v.sortOrder)));
  return {
    meetingAtIso,
    people: v.people.trim(),
    feedback: v.feedback.trim(),
    nextStep: v.nextStep.trim(),
    documentUrl: v.documentUrl.trim(),
    documentName: v.documentName.trim(),
    actions: v.actions.trim(),
    notes: v.notes.trim(),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

function normalizeFromEntry(e: OpportunityStageEntry): NormalizedStage {
  let meetingAtIso: string | null = null;
  if (e.meetingAt) {
    const ms = new Date(e.meetingAt).getTime();
    if (!Number.isNaN(ms)) meetingAtIso = new Date(e.meetingAt).toISOString();
  }
  const sortOrder =
    typeof e.sortOrder === 'number' && Number.isFinite(e.sortOrder) ? Math.max(0, Math.floor(e.sortOrder)) : 0;
  return {
    meetingAtIso,
    people: (e.people ?? '').trim(),
    feedback: (e.feedback ?? '').trim(),
    nextStep: (e.nextStep ?? '').trim(),
    documentUrl: (e.documentUrl ?? '').trim(),
    documentName: (e.documentName ?? '').trim(),
    actions: (e.actions ?? '').trim(),
    notes: (e.notes ?? '').trim(),
    sortOrder,
  };
}

function dtoFieldFromNormalized(n: NormalizedStage): CreateOpportunityStageEntryDto {
  const body: CreateOpportunityStageEntryDto = {};
  if (n.meetingAtIso) body.meetingAt = n.meetingAtIso;
  if (n.people) body.people = n.people;
  if (n.feedback) body.feedback = n.feedback;
  if (n.nextStep) body.nextStep = n.nextStep;
  if (n.documentUrl) body.documentUrl = n.documentUrl;
  if (n.documentName) body.documentName = n.documentName;
  if (n.actions) body.actions = n.actions;
  if (n.notes) body.notes = n.notes;
  body.sortOrder = n.sortOrder;
  return body;
}

/** Create: omit empty strings; always include sortOrder. */
export function formValuesToCreateBody(values: StageEntryFormValues): CreateOpportunityStageEntryDto {
  return dtoFieldFromNormalized(normalizeFromForm(values));
}

/** PATCH: only changed fields vs initial entry; empty string clears a text field when it had content. */
export function formValuesToPatchBody(
  initial: OpportunityStageEntry,
  values: StageEntryFormValues,
): UpdateOpportunityStageEntryDto {
  const before = normalizeFromEntry(initial);
  const after = normalizeFromForm(values);
  const patch: UpdateOpportunityStageEntryDto = {};

  if (after.meetingAtIso !== before.meetingAtIso) {
    if (after.meetingAtIso) patch.meetingAt = after.meetingAtIso;
    else if (before.meetingAtIso) patch.meetingAt = '';
  }

  const textKeys: (keyof Omit<NormalizedStage, 'meetingAtIso' | 'sortOrder'>)[] = [
    'people',
    'feedback',
    'nextStep',
    'documentUrl',
    'documentName',
    'actions',
    'notes',
  ];
  for (const k of textKeys) {
    if (after[k] !== before[k]) {
      (patch as Record<string, string>)[k] = after[k];
    }
  }

  if (after.sortOrder !== before.sortOrder) {
    patch.sortOrder = after.sortOrder;
  }

  return patch;
}
