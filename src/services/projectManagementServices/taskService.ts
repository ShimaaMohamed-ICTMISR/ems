import projectManagementApiClient from './projectManagementApiClient';
import axios from 'axios';

export interface Task {
  id: string;
  projectId?: string;
  projectPhaseId?: string | null;
  milestoneId?: string | null;
  employerId?: string | null;
  title?: string | null;
  description?: string | null;
  priority?: number;
  status?: number;
  startDateUtc?: string;
  dueDateUtc?: string | null;
  completionPercentage?: number;
  effortEstimateHours?: number;
  assignedToMemberId?: string | null;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
  isDeleted?: boolean;
}

export interface TaskCreateDTO {
  projectId?: string | null;
  projectPhaseId?: string | null;
  milestoneId?: string | null;
  employerId?: string | null;
  title: string;
  description?: string | null;
  priority?: number;
  status?: number;
  startDateUtc?: string;
  dueDateUtc?: string | null;
  completionPercentage?: number;
  effortEstimateHours?: number;
  assignedToMemberId?: string | null;
}

export interface TaskUpdateDTO {
  id?: string;
  projectId?: string | null;
  rowVersion: string;
  projectPhaseId?: string | null;
  milestoneId?: string | null;
  employerId?: string | null;
  title: string;
  description?: string | null;
  priority?: number;
  status?: number;
  startDateUtc?: string;
  dueDateUtc?: string | null;
  completionPercentage?: number;
  effortEstimateHours?: number;
  assignedToMemberId?: string | null;
}

export interface TaskQueryParams {
  projectId?: string;
  projectPhaseId?: string;
  milestoneId?: string;
  assignedMemberId?: string;
  status?: number;
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
  data?: unknown;
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
    normalized.includes('no task')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isDeletedEntity(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (value as { isDeleted?: boolean }).isDeleted === true;
}

async function isTaskDeleted(id: string): Promise<boolean> {
  try {
    const response = await projectManagementApiClient.get(`/Tasks/${id}`, {
      params: { _ts: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    const payload = response.data as ApiStatusEnvelope | Task | null | undefined;
    const message = extractApiMessage(payload);
    const task = extractPayload<Task | null | undefined>(response);

    if (!task) {
      return true;
    }

    if (isDeletedEntity(task)) {
      return true;
    }

    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      (payload as ApiStatusEnvelope).data == null
    ) {
      return true;
    }

    if (isExplicitApiFailure(payload) && isNotFoundMessage(message)) {
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

async function waitForTaskDeleted(id: string, attempts = 4, delayMs = 300): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const missing = await isTaskDeleted(id);

    if (missing) {
      return true;
    }

    if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }

  return false;
}

export const taskService = {
  getTasks: async (params: TaskQueryParams = {}): Promise<Task[]> => {
    const response = await projectManagementApiClient.get('/Tasks', { params });
    const tasks = extractPayload<Task[]>(response) || [];
    return tasks.filter((task) => !isDeletedEntity(task));
  },

  createTask: async (payload: TaskCreateDTO): Promise<Task> => {
    const response = await projectManagementApiClient.post('/Tasks', payload);
    return extractPayload<Task>(response);
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await projectManagementApiClient.get(`/Tasks/${id}`);
    const task = extractPayload<Task>(response);

    if (isDeletedEntity(task)) {
      throw new Error('Task not found.');
    }

    return task;
  },

  updateTaskById: async (id: string, payload: TaskUpdateDTO): Promise<Task | void> => {
    const response = await projectManagementApiClient.put(`/Tasks/${id}`, payload);
    return extractPayload<Task | void>(response);
  },

  deleteTaskById: async (id: string): Promise<void> => {
    const response = await projectManagementApiClient.delete(`/Tasks/${id}`);

    if (isExplicitApiFailure(response.data)) {
      throw new Error(extractApiMessage(response.data) || 'Failed to delete task.');
    }

    const deleted = await waitForTaskDeleted(id);
    if (!deleted) {
      throw new Error('Delete request was sent, but the task is not marked as deleted yet.');
    }
  },
};

export default taskService;
