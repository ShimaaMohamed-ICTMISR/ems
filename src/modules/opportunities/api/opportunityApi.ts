/**
 * Opportunity Management Service — all Leads, Opportunities, Quotes API calls.
 * Contract source: OpenAPI at /api/docs-json (verified).
 */
import {
  opportunityManagementClient,
  extractOpportunityApiError,
  unwrapEntity,
  unwrapList,
  unwrapPaginated,
} from './opportunityClient';
import type {
  Lead,
  CreateLeadDto,
  QualifyLeadDto,
  ConvertLeadDto,
  Opportunity,
  CreateOpportunityDto,
  ChangeStageDto,
  AssignOpportunityDto,
  CloseOpportunityDto,
  Quote,
  CreateQuoteDto,
  ApproveQuoteDto,
  OpportunityHistory,
} from '../types/opportunity.types';

async function handle<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new Error(extractOpportunityApiError(e));
  }
}

// ─── Leads ─────────────────────────────────────────

export async function createLead(data: CreateLeadDto): Promise<Lead> {
  return handle(async () => {
    const res = await opportunityManagementClient.post('/leads', data);
    return unwrapEntity<Lead>(res.data);
  });
}

export async function getLeads(params?: {
  page?: number;
  limit?: number;
}): Promise<Lead[]> {
  return handle(async () => {
    const res = await opportunityManagementClient.get('/leads', { params });
    const { items } = unwrapPaginated<Lead>(res.data, params?.limit ?? 20);
    return items;
  });
}

export async function getLeadById(id: string): Promise<Lead> {
  return handle(async () => {
    const res = await opportunityManagementClient.get(`/leads/${id}`);
    return unwrapEntity<Lead>(res.data);
  });
}

export async function deleteLead(id: string): Promise<void> {
  return handle(async () => {
    await opportunityManagementClient.delete(`/leads/${id}`);
  });
}

export async function qualifyLead(id: string, data: QualifyLeadDto): Promise<Lead> {
  return handle(async () => {
    const res = await opportunityManagementClient.patch(`/leads/${id}/qualify`, data);
    return unwrapEntity<Lead>(res.data);
  });
}

export async function convertLeadToOpportunity(
  id: string,
  data: ConvertLeadDto,
): Promise<Opportunity> {
  return handle(async () => {
    const res = await opportunityManagementClient.post(`/leads/${id}/convert`, data);
    return unwrapEntity<Opportunity>(res.data);
  });
}

// ─── Opportunities ─────────────────────────────────

export async function createOpportunity(data: CreateOpportunityDto): Promise<Opportunity> {
  return handle(async () => {
    const res = await opportunityManagementClient.post('/opportunities', data);
    return unwrapEntity<Opportunity>(res.data);
  });
}

export async function getOpportunities(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: Opportunity[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
  return handle(async () => {
    const res = await opportunityManagementClient.get('/opportunities', { params });
    const p = unwrapPaginated<Opportunity>(res.data, params?.limit ?? 20);
    return {
      items: p.items,
      pagination: {
        total: p.total,
        page: p.page,
        limit: p.limit,
        totalPages: p.totalPages,
      },
    };
  });
}

export async function getOpportunityById(id: string): Promise<Opportunity> {
  return handle(async () => {
    const res = await opportunityManagementClient.get(`/opportunities/${id}`);
    return unwrapEntity<Opportunity>(res.data);
  });
}

/** Backend DTO: only `stage` required; omit empty `reason` to avoid server bugs on "". */
function buildChangeStageBody(data: ChangeStageDto): ChangeStageDto {
  const body: ChangeStageDto = { stage: data.stage };
  const reason = data.reason?.trim();
  if (reason) body.reason = reason;
  return body;
}

export async function changeOpportunityStage(
  id: string,
  data: ChangeStageDto,
): Promise<Opportunity> {
  return handle(async () => {
    const res = await opportunityManagementClient.patch(
      `/opportunities/${id}/stage`,
      buildChangeStageBody(data),
    );
    return unwrapEntity<Opportunity>(res.data);
  });
}

export async function assignOpportunity(
  id: string,
  data: AssignOpportunityDto,
): Promise<Opportunity> {
  return handle(async () => {
    const res = await opportunityManagementClient.patch(`/opportunities/${id}/assign`, data);
    return unwrapEntity<Opportunity>(res.data);
  });
}

export async function closeOpportunity(
  id: string,
  data: CloseOpportunityDto,
): Promise<Opportunity> {
  return handle(async () => {
    const res = await opportunityManagementClient.post(`/opportunities/${id}/close`, data);
    return unwrapEntity<Opportunity>(res.data);
  });
}

export async function getOpportunityHistory(id: string): Promise<OpportunityHistory[]> {
  return handle(async () => {
    const res = await opportunityManagementClient.get(`/opportunities/${id}/history`);
    return unwrapList<OpportunityHistory>(res.data);
  });
}

// ─── Quotes ────────────────────────────────────────

export async function createQuote(
  opportunityId: string,
  data: CreateQuoteDto,
): Promise<Quote> {
  return handle(async () => {
    const res = await opportunityManagementClient.post(
      `/opportunities/${opportunityId}/quotes`,
      data,
    );
    return unwrapEntity<Quote>(res.data);
  });
}

export async function getQuotesForOpportunity(opportunityId: string): Promise<Quote[]> {
  return handle(async () => {
    const res = await opportunityManagementClient.get(
      `/opportunities/${opportunityId}/quotes`,
    );
    return unwrapList<Quote>(res.data);
  });
}

export async function getQuoteById(
  opportunityId: string,
  quoteId: string,
): Promise<Quote> {
  return handle(async () => {
    const res = await opportunityManagementClient.get(
      `/opportunities/${opportunityId}/quotes/${quoteId}`,
    );
    return unwrapEntity<Quote>(res.data);
  });
}

export async function approveQuote(
  opportunityId: string,
  quoteId: string,
  data: ApproveQuoteDto,
): Promise<Quote> {
  return handle(async () => {
    const res = await opportunityManagementClient.patch(
      `/opportunities/${opportunityId}/quotes/${quoteId}/approve`,
      data,
    );
    return unwrapEntity<Quote>(res.data);
  });
}

// ─── System (optional) ───────────────────────────────

export async function getApiRoutes(): Promise<unknown> {
  return handle(async () => {
    const res = await opportunityManagementClient.get('/system/routes');
    return res.data;
  });
}

export async function getOpportunityServicePermissions(): Promise<string[]> {
  return handle(async () => {
    const res = await opportunityManagementClient.get('/permissions');
    const raw = unwrapEntity<unknown>(res.data);
    if (Array.isArray(raw)) return raw as string[];
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: string[] }).data)) {
      return (raw as { data: string[] }).data;
    }
    return [];
  });
}
