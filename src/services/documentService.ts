import projectManagementApiClient from './projectManagementApiClient';

export interface ProjectDocument {
  id: string;
  projectId: string;
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

export interface DocumentCreateDTO {
  projectId: string;
  name: string;
  type: number;
  filePath: string;
  version?: number;
  uploadedBy?: string;
  uploadedAtUtc?: string;
}

export interface DocumentUpdateDTO {
  id: string;
  projectId: string;
  rowVersion: string;
  name: string;
  type: number;
  filePath: string;
  version?: number;
  uploadedBy?: string;
  uploadedAtUtc?: string;
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

export const documentService = {
  getDocuments: async (projectId?: string): Promise<ProjectDocument[]> => {
    const params = projectId ? { projectId } : {};
    const response = await projectManagementApiClient.get('/Documents', { params });
    const result = extractPayload<ProjectDocument[]>(response);
    return Array.isArray(result) ? result : [];
  },

  createDocument: async (payload: DocumentCreateDTO): Promise<ProjectDocument> => {
    const response = await projectManagementApiClient.post('/Documents', payload);
    return extractPayload<ProjectDocument>(response);
  },

  getDocumentById: async (id: string): Promise<ProjectDocument> => {
    const response = await projectManagementApiClient.get(`/Documents/${id}`);
    return extractPayload<ProjectDocument>(response);
  },

  updateDocumentById: async (id: string, payload: DocumentUpdateDTO): Promise<ProjectDocument | void> => {
    const response = await projectManagementApiClient.put(`/Documents/${id}`, payload);
    return extractPayload<ProjectDocument | void>(response);
  },

  deleteDocumentById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Documents/${id}`);
  },
};

export default documentService;
