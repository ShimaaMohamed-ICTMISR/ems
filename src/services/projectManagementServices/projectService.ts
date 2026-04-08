import axios from 'axios';
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

type ApiStatusEnvelope = {
  success?: boolean;
  succeeded?: boolean;
  isSuccess?: boolean;
  message?: string;
  error?: string;
  title?: string;
};

function extractApiMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const envelope = payload as ApiStatusEnvelope;
  return envelope.message || envelope.error || envelope.title;
}

function isExplicitApiFailure(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const envelope = payload as ApiStatusEnvelope;
  return (
    envelope.success === false ||
    envelope.succeeded === false ||
    envelope.isSuccess === false
  );
}

function isNotFoundMessage(message?: string): boolean {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes('not found') ||
    normalized.includes('does not exist') ||
    normalized.includes('no project')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function isProjectMissing(id: string): Promise<boolean> {
  try {
    const response = await projectManagementApiClient.get(`/Projects/${id}`);
    const message = extractApiMessage(response.data);

    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      const data = (response.data as { data?: unknown }).data;
      if (data == null) {
        return true;
      }
    }

    if (isExplicitApiFailure(response.data) && isNotFoundMessage(message)) {
      return true;
    }

    return false;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = extractApiMessage(error.response?.data);

      if (status === 404 || isNotFoundMessage(message)) {
        return true;
      }
    }

    throw error;
  }
}

async function waitForProjectMissing(id: string, attempts = 4, delayMs = 300): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const missing = await isProjectMissing(id);
    if (missing) {
      return true;
    }

    if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }

  return false;
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
    const response = await projectManagementApiClient.delete(`/Projects/${id}`);

    if (isExplicitApiFailure(response.data)) {
      throw new Error(extractApiMessage(response.data) || 'Failed to delete project.');
    }

    const deleted = await waitForProjectMissing(id);
    if (!deleted) {
      throw new Error('Delete request was sent, but the project still exists.');
    }
  },
};

export default projectService;
