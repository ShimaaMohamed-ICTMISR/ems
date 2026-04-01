import projectManagementApiClient from './projectManagementApiClient';

export interface Milestone {
  id: string;
  projectId?: string | null;
  projectPhaseId?: string | null;
  name?: string | null;
  targetDateUtc?: string;
  actualDateUtc?: string | null;
  successCriteria?: string | null;
  isCompleted?: boolean;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface MilestoneCreateDTO {
  projectId: string;
  projectPhaseId?: string;
  name: string;
  targetDateUtc?: string;
  successCriteria?: string;
  isCompleted?: boolean;
}

export interface MilestoneUpdateDTO {
  id: string;
  projectId?: string | null;
  rowVersion: string;
  projectPhaseId?: string | null;
  name: string;
  targetDateUtc?: string;
  actualDateUtc?: string | null;
  successCriteria?: string | null;
  isCompleted?: boolean;
}

export interface MilestoneQueryParams {
  projectId?: string;
  projectPhaseId?: string;
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

export const milestoneService = {
  getMilestones: async (params: MilestoneQueryParams = {}): Promise<Milestone[]> => {
    const response = await projectManagementApiClient.get('/Milestones', { params });
    const result = extractPayload<Milestone[]>(response);
    return Array.isArray(result) ? result : [];
  },

  createMilestone: async (payload: MilestoneCreateDTO): Promise<Milestone> => {
    const response = await projectManagementApiClient.post('/Milestones', payload);
    return extractPayload<Milestone>(response);
  },

  getMilestoneById: async (id: string): Promise<Milestone> => {
    const response = await projectManagementApiClient.get(`/Milestones/${id}`);
    return extractPayload<Milestone>(response);
  },

  updateMilestoneById: async (id: string, payload: MilestoneUpdateDTO): Promise<Milestone | void> => {
    const response = await projectManagementApiClient.put(`/Milestones/${id}`, payload);
    return extractPayload<Milestone | void>(response);
  },

  deleteMilestoneById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Milestones/${id}`);
  },
};

export default milestoneService;
