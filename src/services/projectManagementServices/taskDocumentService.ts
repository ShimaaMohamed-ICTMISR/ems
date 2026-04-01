import projectManagementApiClient from './projectManagementApiClient';

export interface TaskDocument {
  id: string;
  projectId?: string | null;
  projectTaskId?: string | null;
  name?: string | null;
  type?: number;
  filePath?: string | null;
  version?: number;
  uploadedBy?: string | null;
  uploadedAtUtc?: string;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface AddTaskDocumentRequest {
  projectId?: string | null;
  name: string;
  type?: number;
  filePath: string;
  version?: number;
  uploadedBy?: string | null;
}

function extractPayload<T>(response: { data: unknown }): T {
  const payload = response.data as T | { data?: T | { data?: T } } | undefined;

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const firstData = payload.data;

    if (firstData && typeof firstData === 'object' && 'data' in firstData) {
      return (firstData as { data: T }).data;
    }

    return firstData as T;
  }

  return payload as T;
}

export const taskDocumentService = {
  getTaskDocuments: async (taskId: string): Promise<TaskDocument[]> => {
    const response = await projectManagementApiClient.get(`/Tasks/${taskId}/documents`);
    const result = extractPayload<TaskDocument[]>(response);
    return Array.isArray(result) ? result : [];
  },

  uploadTaskDocument: async (
    taskId: string,
    payload: AddTaskDocumentRequest,
  ): Promise<TaskDocument> => {
    const response = await projectManagementApiClient.post(`/Tasks/${taskId}/documents`, payload);
    return extractPayload<TaskDocument>(response);
  },

  deleteTaskDocument: async (taskId: string, documentId: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Tasks/${taskId}/documents/${documentId}`);
  },
};

export default taskDocumentService;
