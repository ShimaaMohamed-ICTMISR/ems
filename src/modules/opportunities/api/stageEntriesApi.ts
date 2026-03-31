/**
 * Opportunity stage entries (activity log) — uses shared opportunityManagementClient only.
 */
import type { AxiosError } from 'axios';
import {
  opportunityManagementClient,
  extractOpportunityApiError,
  unwrapEntity,
  unwrapList,
} from './opportunityClient';
import type {
  CreateOpportunityStageEntryDto,
  OpportunityStageEntry,
  UpdateOpportunityStageEntryDto,
} from '../types/opportunity.types';

async function handle<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new Error(extractOpportunityApiError(e));
  }
}

/** If dedicated list route errors, OpenAPI allows the same data on GET /opportunities/{id}?includeStageEntries=true */
function extractStageEntriesFromOpportunityPayload(raw: unknown): OpportunityStageEntry[] {
  const layer = unwrapEntity<Record<string, unknown>>(raw);
  const nested =
    layer.data && typeof layer.data === 'object' ? (layer.data as Record<string, unknown>) : null;
  const candidates = [layer.stageEntries, layer.stage_entries, nested?.stageEntries, nested?.stage_entries];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as OpportunityStageEntry[];
  }
  return [];
}

export async function listStageEntries(opportunityId: string): Promise<OpportunityStageEntry[]> {
  try {
    const res = await opportunityManagementClient.get(`/opportunities/${opportunityId}/stage-entries`);
    return unwrapList<OpportunityStageEntry>(res.data);
  } catch (e) {
    const status = (e as AxiosError).response?.status;
    const retryable = status === 500 || status === 502 || status === 503;
    if (!retryable) {
      throw new Error(extractOpportunityApiError(e));
    }
    try {
      const res = await opportunityManagementClient.get(`/opportunities/${opportunityId}`, {
        params: { includeStageEntries: 'true' },
      });
      return extractStageEntriesFromOpportunityPayload(res.data);
    } catch (fallbackErr) {
      throw new Error(extractOpportunityApiError(fallbackErr));
    }
  }
}

export async function createStageEntry(
  opportunityId: string,
  body: CreateOpportunityStageEntryDto,
): Promise<OpportunityStageEntry> {
  return handle(async () => {
    const res = await opportunityManagementClient.post(
      `/opportunities/${opportunityId}/stage-entries`,
      body,
    );
    return unwrapEntity<OpportunityStageEntry>(res.data);
  });
}

export async function updateStageEntry(
  opportunityId: string,
  entryId: string,
  body: UpdateOpportunityStageEntryDto,
): Promise<OpportunityStageEntry> {
  return handle(async () => {
    const res = await opportunityManagementClient.patch(
      `/opportunities/${opportunityId}/stage-entries/${entryId}`,
      body,
    );
    return unwrapEntity<OpportunityStageEntry>(res.data);
  });
}

export async function deleteStageEntry(opportunityId: string, entryId: string): Promise<void> {
  return handle(async () => {
    await opportunityManagementClient.delete(
      `/opportunities/${opportunityId}/stage-entries/${entryId}`,
    );
  });
}
