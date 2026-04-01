import projectManagementApiClient from './projectManagementApiClient';

export interface Project {
  id: string;
  name?: string | null;
  objectives?: string | null;
  scope?: string | null;
  startDateUtc?: string;
  endDateUtc?: string;
  stage?: number;
  healthStatus?: number;
  methodology?: number;
  portfolioId?: string | null;
  templateId?: string | null;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface ProjectCreateDTO {
  name: string;
  objectives?: string;
  scope?: string;
  startDateUtc?: string;
  endDateUtc?: string;
  stage?: number;
  healthStatus?: number;
  methodology?: number;
  portfolioId?: string;
  templateId?: string;
}

export interface ProjectUpdateDTO {
  id: string;
  name: string;
  rowVersion: string;
  objectives?: string;
  scope?: string;
  startDateUtc?: string;
  endDateUtc?: string;
  stage?: number;
  healthStatus?: number;
  methodology?: number;
  portfolioId?: string;
  templateId?: string;
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

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await projectManagementApiClient.get('/Projects');
    return extractPayload<Project[]>(response) || [];
  },

  createProject: async (payload: ProjectCreateDTO): Promise<Project> => {
    const response = await projectManagementApiClient.post('/Projects', payload);
    return extractPayload<Project>(response);
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await projectManagementApiClient.get(`/Projects/${id}`);
    return extractPayload<Project>(response);
  },

  updateProjectById: async (id: string, payload: ProjectUpdateDTO): Promise<Project | void> => {
    const response = await projectManagementApiClient.put(`/Projects/${id}`, payload);
    return extractPayload<Project | void>(response);
  },

  deleteProjectById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Projects/${id}`);
  },
};

export default projectService;
