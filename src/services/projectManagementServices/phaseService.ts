import projectManagementApiClient from './projectManagementApiClient';

export interface Phase {
  id: string;
  projectId?: string;
  name?: string | null;
  startDateUtc?: string;
  endDateUtc?: string;
  deliverables?: string | null;
  isGatePassed?: boolean;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface PhaseCreateDTO {
  projectId: string;
  name: string;
  startDateUtc?: string;
  endDateUtc?: string;
  deliverables?: string;
  isGatePassed?: boolean;
}

export interface PhaseUpdateDTO {
  id: string;
  projectId: string;
  rowVersion: string;
  name: string;
  startDateUtc?: string;
  endDateUtc?: string;
  deliverables?: string;
  isGatePassed?: boolean;
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

export const phaseService = {
  getPhases: async (projectId: string): Promise<Phase[]> => {
    const response = await projectManagementApiClient.get('/project-admin/phases', { params: { projectId } });
    const result = extractPayload<Phase[]>(response);
    return Array.isArray(result) ? result : [];
  },

  createPhase: async (payload: PhaseCreateDTO): Promise<Phase> => {
    const response = await projectManagementApiClient.post('/project-admin/phases', payload);
    return extractPayload<Phase>(response);
  },

  getPhaseById: async (id: string): Promise<Phase> => {
    const response = await projectManagementApiClient.get(`/project-admin/phases/${id}`);
    return extractPayload<Phase>(response);
  },

  updatePhase: async (id: string, payload: PhaseUpdateDTO): Promise<Phase | void> => {
    const response = await projectManagementApiClient.put(`/project-admin/phases/${id}`, payload);
    return extractPayload<Phase | void>(response);
  },

  deletePhase: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/project-admin/phases/${id}`);
  },
};

export default phaseService;
