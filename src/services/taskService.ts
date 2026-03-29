import projectManagementApiClient from './projectManagementApiClient';

export interface Task {
  id: string;
  projectId?: string;
  projectPhaseId?: string | null;
  milestoneId?: string | null;
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
}

export interface TaskCreateDTO {
  projectId: string;
  projectPhaseId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  priority?: number;
  status?: number;
  startDateUtc?: string;
  dueDateUtc?: string;
  completionPercentage?: number;
  effortEstimateHours?: number;
  assignedToMemberId?: string;
}

export interface TaskUpdateDTO {
  id: string;
  projectId: string;
  rowVersion: string;
  projectPhaseId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  priority?: number;
  status?: number;
  startDateUtc?: string;
  dueDateUtc?: string;
  completionPercentage?: number;
  effortEstimateHours?: number;
  assignedToMemberId?: string;
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

export const taskService = {
  getTasks: async (params: TaskQueryParams = {}): Promise<Task[]> => {
    const response = await projectManagementApiClient.get('/Tasks', { params });
    return extractPayload<Task[]>(response) || [];
  },

  createTask: async (payload: TaskCreateDTO): Promise<Task> => {
    const response = await projectManagementApiClient.post('/Tasks', payload);
    return extractPayload<Task>(response);
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await projectManagementApiClient.get(`/Tasks/${id}`);
    return extractPayload<Task>(response);
  },

  updateTaskById: async (id: string, payload: TaskUpdateDTO): Promise<Task | void> => {
    const response = await projectManagementApiClient.put(`/Tasks/${id}`, payload);
    return extractPayload<Task | void>(response);
  },

  deleteTaskById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Tasks/${id}`);
  },
};

export default taskService;
