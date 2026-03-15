import axios from 'axios';
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
  OpportunityHistory
} from '../types/opportunity.types';

// Opportunity service API base URL
const OPPORTUNITY_API_BASE = 'https://ems-opportunity-management-service.onrender.com/api/v1';

const opportunityClient = axios.create({
  baseURL: OPPORTUNITY_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
opportunityClient.interceptors.request.use(
  (config) => {
    // Add user auth token
    const userToken = localStorage.getItem('authToken');
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    console.log('Opportunity API request:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
opportunityClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Opportunity API error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

// ============= LEAD ENDPOINTS =============

export const createLead = async (data: CreateLeadDto): Promise<Lead> => {
  const response = await opportunityClient.post('/leads', data);
  return response.data;
};

export const getLeads = async (): Promise<Lead[]> => {
  const response = await opportunityClient.get('/leads');
  return response.data;
};

export const getLeadById = async (id: string): Promise<Lead> => {
  const response = await opportunityClient.get(`/leads/${id}`);
  return response.data;
};

export const deleteLead = async (id: string): Promise<void> => {
  await opportunityClient.delete(`/leads/${id}`);
};

export const qualifyLead = async (id: string, data: QualifyLeadDto): Promise<Lead> => {
  const response = await opportunityClient.patch(`/leads/${id}/qualify`, data);
  return response.data;
};

export const convertLeadToOpportunity = async (id: string, data: ConvertLeadDto): Promise<Opportunity> => {
  const response = await opportunityClient.post(`/leads/${id}/convert`, data);
  return response.data;
};

// ============= OPPORTUNITY ENDPOINTS =============

export const createOpportunity = async (data: CreateOpportunityDto): Promise<Opportunity> => {
  const response = await opportunityClient.post('/opportunities', data);
  return response.data;
};

export const getOpportunities = async (): Promise<Opportunity[]> => {
  const response = await opportunityClient.get('/opportunities');
  return response.data;
};

export const getOpportunityById = async (id: string): Promise<Opportunity> => {
  const response = await opportunityClient.get(`/opportunities/${id}`);
  return response.data;
};

export const changeOpportunityStage = async (id: string, data: ChangeStageDto): Promise<Opportunity> => {
  const response = await opportunityClient.patch(`/opportunities/${id}/stage`, data);
  return response.data;
};

export const assignOpportunity = async (id: string, data: AssignOpportunityDto): Promise<Opportunity> => {
  const response = await opportunityClient.patch(`/opportunities/${id}/assign`, data);
  return response.data;
};

export const closeOpportunity = async (id: string, data: CloseOpportunityDto): Promise<Opportunity> => {
  const response = await opportunityClient.post(`/opportunities/${id}/close`, data);
  return response.data;
};

export const getOpportunityHistory = async (id: string): Promise<OpportunityHistory[]> => {
  const response = await opportunityClient.get(`/opportunities/${id}/history`);
  return response.data;
};

// ============= QUOTE ENDPOINTS =============

export const createQuote = async (opportunityId: string, data: CreateQuoteDto): Promise<Quote> => {
  const response = await opportunityClient.post(`/opportunities/${opportunityId}/quotes`, data);
  return response.data;
};

export const getQuotesForOpportunity = async (opportunityId: string): Promise<Quote[]> => {
  const response = await opportunityClient.get(`/opportunities/${opportunityId}/quotes`);
  return response.data;
};

export const getQuoteById = async (opportunityId: string, quoteId: string): Promise<Quote> => {
  const response = await opportunityClient.get(`/opportunities/${opportunityId}/quotes/${quoteId}`);
  return response.data;
};

export const approveQuote = async (opportunityId: string, quoteId: string, data: ApproveQuoteDto): Promise<Quote> => {
  const response = await opportunityClient.patch(`/opportunities/${opportunityId}/quotes/${quoteId}/approve`, data);
  return response.data;
};

// ============= SYSTEM ENDPOINTS =============

export const getApiRoutes = async () => {
  const response = await opportunityClient.get('/system/routes');
  return response.data;
};

export const getPermissions = async () => {
  const response = await opportunityClient.get('/permissions');
  return response.data;
};