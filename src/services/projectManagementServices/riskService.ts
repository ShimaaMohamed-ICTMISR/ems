import projectManagementApiClient from './projectManagementApiClient';

export interface Risk {
  id: string;
  projectId: string;
  description?: string | null;
  probability?: number;
  impact?: number;
  mitigationPlan?: string | null;
  ownerId?: string | null;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface RiskCreateDTO {
  projectId: string;
  description: string;
  probability?: number;
  impact?: number;
  mitigationPlan?: string;
  ownerId?: string;
}

export interface RiskUpdateDTO {
  id: string;
  projectId: string;
  rowVersion: string;
  description: string;
  probability?: number;
  impact?: number;
  mitigationPlan?: string;
  ownerId?: string;
}

export interface RiskEvent {
  id: string;
  projectRiskId: string;
  incidentDescription?: string | null;
  status?: number;
  occurredAtUtc?: string;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface RiskEventCreateDTO {
  projectRiskId: string;
  incidentDescription: string;
  status?: number;
  occurredAtUtc?: string;
}

export interface RiskEventUpdateDTO {
  id: string;
  projectRiskId: string;
  rowVersion: string;
  incidentDescription: string;
  status?: number;
  occurredAtUtc?: string;
}

function extractPayload<T>(response: { data: unknown }): T {
  const payload = response.data as
    | T
    | { data?: T | { data?: T } }
    | undefined;

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const firstData = payload.data;
    if (firstData && typeof firstData === 'object' && 'data' in firstData) {
      return (firstData as { data: T }).data;
    }
    return firstData as T;
  }

  return payload as T;
}

export const riskService = {
  getRisks: async (projectId?: string): Promise<Risk[]> => {
    const params = projectId ? { projectId } : {};
    const response = await projectManagementApiClient.get('/Risks', { params });
    const result = extractPayload<Risk[]>(response);
    return Array.isArray(result) ? result : [];
  },

  createRisk: async (payload: RiskCreateDTO): Promise<Risk> => {
    const response = await projectManagementApiClient.post('/Risks', payload);
    return extractPayload<Risk>(response);
  },

  getRiskById: async (id: string): Promise<Risk> => {
    const response = await projectManagementApiClient.get(`/Risks/${id}`);
    return extractPayload<Risk>(response);
  },

  updateRiskById: async (id: string, payload: RiskUpdateDTO): Promise<Risk | void> => {
    const response = await projectManagementApiClient.put(`/Risks/${id}`, payload);
    return extractPayload<Risk | void>(response);
  },

  deleteRiskById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Risks/${id}`);
  },

  getRiskEvents: async (riskId?: string): Promise<RiskEvent[]> => {
    const params = riskId ? { riskId } : {};
    const response = await projectManagementApiClient.get('/Risks/events', { params });
    const result = extractPayload<RiskEvent[]>(response);
    return Array.isArray(result) ? result : [];
  },

  createRiskEvent: async (payload: RiskEventCreateDTO): Promise<RiskEvent> => {
    const response = await projectManagementApiClient.post('/Risks/events', payload);
    return extractPayload<RiskEvent>(response);
  },

  getRiskEventById: async (id: string): Promise<RiskEvent> => {
    const response = await projectManagementApiClient.get(`/Risks/events/${id}`);
    return extractPayload<RiskEvent>(response);
  },

  updateRiskEventById: async (id: string, payload: RiskEventUpdateDTO): Promise<RiskEvent | void> => {
    const response = await projectManagementApiClient.put(`/Risks/events/${id}`, payload);
    return extractPayload<RiskEvent | void>(response);
  },

  deleteRiskEventById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Risks/events/${id}`);
  },
};

export default riskService;
