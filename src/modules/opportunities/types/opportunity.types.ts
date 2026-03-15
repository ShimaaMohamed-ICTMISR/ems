// Opportunity Management Types
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED';
export type OpportunityStage = 'PROSPECTING' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';

// Lead interfaces
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status: LeadStatus;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  notes?: string;
  assignedTo?: string;
}

export interface QualifyLeadDto {
  qualified: boolean;
  notes?: string;
}

export interface ConvertLeadDto {
  opportunityTitle: string;
  expectedValue: number;
  expectedCloseDate: string;
  stage?: OpportunityStage;
}

// Opportunity interfaces
export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  expectedValue: number;
  actualValue?: number;
  probability: number;
  stage: OpportunityStage;
  expectedCloseDate: string;
  actualCloseDate?: string;
  leadId?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lead?: Lead;
  quotes?: Quote[];
}

export interface CreateOpportunityDto {
  title: string;
  description?: string;
  expectedValue: number;
  probability?: number;
  stage?: OpportunityStage;
  expectedCloseDate: string;
  leadId?: string;
  assignedTo?: string;
}

export interface ChangeStageDto {
  stage: OpportunityStage;
  notes?: string;
}

export interface AssignOpportunityDto {
  assignedTo: string;
}

export interface CloseOpportunityDto {
  stage: 'CLOSED_WON' | 'CLOSED_LOST';
  actualValue?: number;
  notes?: string;
}

// Quote interfaces
export interface Quote {
  id: string;
  opportunityId: string;
  title: string;
  description?: string;
  totalAmount: number;
  validUntil: string;
  status: QuoteStatus;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
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

export interface CreateQuoteDto {
  title: string;
  description?: string;
  totalAmount: number;
  validUntil: string;
  items?: Omit<QuoteItem, 'id' | 'quoteId'>[];
}

export interface ApproveQuoteDto {
  approved: boolean;
  notes?: string;
}

// History and Analytics
export interface OpportunityHistory {
  id: string;
  opportunityId: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}