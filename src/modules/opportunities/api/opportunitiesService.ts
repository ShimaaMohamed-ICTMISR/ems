/**
 * Re-exports and type aliases for the Opportunities UI.
 * All HTTP calls live in opportunityApi.ts + opportunityClient.ts.
 */
import type {
  AssignOpportunityDto,
  ChangeStageDto,
  CloseOpportunityDto,
  CreateOpportunityDto,
  Opportunity,
  OpportunityHistory,
  OpportunityStageApi,
  UpdateOpportunityDto,
} from '../types/opportunity.types';
import * as api from './opportunityApi';

export type OpportunityStage = OpportunityStageApi;
export type CreateOpportunityPayload = CreateOpportunityDto;
export type ChangeStagePayload = ChangeStageDto;
export type AssignOpportunityPayload = AssignOpportunityDto;
export type CloseOpportunityPayload = CloseOpportunityDto;
export type OpportunityHistoryEntry = OpportunityHistory;
export type UpdateOpportunityPayload = UpdateOpportunityDto;

export type { Opportunity };

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedOpportunities {
  items: Opportunity[];
  pagination: PaginationMeta;
}

export async function createOpportunity(
  payload: CreateOpportunityPayload,
): Promise<Opportunity> {
  return api.createOpportunity(payload);
}

export async function getOpportunities(
  params: PaginationParams = {},
): Promise<PaginatedOpportunities> {
  return api.getOpportunities(params);
}

export async function getOpportunityById(id: string): Promise<Opportunity> {
  return api.getOpportunityById(id);
}

export async function updateOpportunity(
  id: string,
  payload: UpdateOpportunityPayload,
): Promise<Opportunity> {
  return api.updateOpportunity(id, payload);
}

export async function deleteOpportunity(id: string): Promise<void> {
  return api.deleteOpportunity(id);
}

export async function changeStage(
  id: string,
  payload: ChangeStagePayload,
): Promise<Opportunity> {
  return api.changeOpportunityStage(id, payload);
}

export async function assignOpportunity(
  id: string,
  payload: AssignOpportunityPayload,
): Promise<Opportunity> {
  return api.assignOpportunity(id, payload);
}

export async function closeOpportunity(
  id: string,
  payload: CloseOpportunityPayload,
): Promise<Opportunity> {
  return api.closeOpportunity(id, payload);
}

export async function getOpportunityHistory(
  id: string,
): Promise<OpportunityHistoryEntry[]> {
  return api.getOpportunityHistory(id);
}
