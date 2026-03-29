/**
 * Opportunity stage entries (activity log) — uses shared opportunityManagementClient only.
 */
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

export async function listStageEntries(opportunityId: string): Promise<OpportunityStageEntry[]> {
  return handle(async () => {
    const res = await opportunityManagementClient.get(
      `/opportunities/${opportunityId}/stage-entries`,
    );
    return unwrapList<OpportunityStageEntry>(res.data);
  });
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
