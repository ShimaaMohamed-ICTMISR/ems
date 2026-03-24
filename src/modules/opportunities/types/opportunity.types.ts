/**
 * Types aligned with Opportunity Management Service OpenAPI (docs-json).
 * Legacy uppercase enums kept where UI still references them; map at API boundary when needed.
 */

export type LeadSource =
  | 'website'
  | 'referral'
  | 'cold_call'
  | 'social_media'
  | 'event'
  | 'other';

/** API may return lowercase or legacy uppercase */
export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'UNQUALIFIED'
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified';

export type OpportunityStageApi =
  | 'prospecting'
  | 'qualification'
  | 'needs_analysis'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

/** Legacy uppercase — prefer OpportunityStageApi for new code */
export type OpportunityStage =
  | 'PROSPECTING'
  | 'QUALIFICATION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | string;

// ─── Lead (response shape is permissive; backend may extend) ───
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  /** OpenAPI uses `title` for job title */
  title?: string;
  jobTitle?: string;
  source?: string;
  status?: LeadStatus;
  notes?: string;
  assignedTo?: string;
  /** OpenAPI workflow: qualified leads can convert */
  isQualified?: boolean;
  estimatedValue?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** CreateLeadDto per OpenAPI — only firstName + lastName required */
export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  source?: LeadSource | string;
  estimatedValue?: number;
  notes?: string;
}

/** QualifyLeadDto — only optional notes in OpenAPI */
export interface QualifyLeadDto {
  notes?: string;
}

/** ConvertLeadDto per OpenAPI */
export interface ConvertLeadDto {
  opportunityName: string;
  amount: number;
  expectedCloseDate: string;
  stage?: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation';
  conversionReason?: string;
}

// ─── Opportunity ───
export interface Opportunity {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  amount?: number;
  expectedValue?: number;
  /** Some APIs use alternate keys — UI reads these via opportunityDisplayAmount */
  value?: number;
  totalAmount?: number;
  estimatedValue?: number;
  actualValue?: number;
  probability?: number;
  stage: OpportunityStageApi | OpportunityStage | string;
  currency?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  accountId?: string;
  leadId?: string;
  assignedTo?: string;
  ownerId?: string;
  /** Often returned after assign (may differ from HR employee id) */
  userId?: string;
  assigneeId?: string;
  assigneeName?: string;
  ownerName?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  type?: string;
  source?: string;
  nextStep?: string;
  /** Optional flags if backend exposes them for UI gating */
  hasApprovedQuote?: boolean;
  hasSignedContract?: boolean;
  lead?: Lead;
  quotes?: Quote[];
}

/** CreateOpportunityDto per OpenAPI */
export interface CreateOpportunityDto {
  name: string;
  accountId?: string;
  stage?: OpportunityStageApi;
  amount: number;
  currency?: string;
  expectedCloseDate: string;
  type?: string;
  source?: string;
  description?: string;
  nextStep?: string;
}

export interface ChangeStageDto {
  stage: OpportunityStageApi;
  reason?: string;
}

export interface AssignOpportunityDto {
  userId: string;
  role?: 'owner' | 'co_owner' | 'viewer';
}

export interface CloseOpportunityDto {
  type: 'won' | 'lost';
  reason?: string;
}

// ─── Quote ───
export interface Quote {
  id: string;
  opportunityId?: string;
  title?: string;
  description?: string;
  totalAmount?: number;
  validUntil: string;
  status: QuoteStatus;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** OpenAPI: validUntil required; totalAmount optional */
export interface CreateQuoteDto {
  totalAmount?: number;
  currency?: string;
  validUntil: string;
}

export interface ApproveQuoteDto {
  notes?: string;
}

export interface OpportunityHistory {
  id: string;
  opportunityId: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  notes?: string;
  reason?: string;
  createdBy?: string;
  createdAt: string;
}
