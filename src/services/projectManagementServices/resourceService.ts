import projectManagementApiClient from './projectManagementApiClient';

// ── Resource types ──

export interface Resource {
  id: string;
  name?: string | null;
  type?: number;
  totalCapacityPercentage?: number;
  skillsOrNotes?: string | null;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface ResourceCreateDTO {
  name: string;
  type?: number;
  totalCapacityPercentage?: number;
  skillsOrNotes?: string;
}

export interface ResourceUpdateDTO {
  id: string;
  rowVersion: string;
  name: string;
  type?: number;
  totalCapacityPercentage?: number;
  skillsOrNotes?: string;
}

// ── Resource Request types ──

export interface ResourceRequest {
  id: string;
  projectId?: string;
  resourceId?: string | null;
  resourceType?: number;
  requestedAllocationPercentage?: number;
  status?: number;
  comments?: string | null;
  approvedBy?: string | null;
  decidedAtUtc?: string | null;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface ResourceRequestCreateDTO {
  projectId: string;
  resourceId?: string;
  resourceType?: number;
  requestedAllocationPercentage?: number;
  status?: number;
  comments?: string;
}

export interface ResourceRequestUpdateDTO {
  id: string;
  projectId: string;
  rowVersion: string;
  resourceId?: string;
  resourceType?: number;
  requestedAllocationPercentage?: number;
  status?: number;
  comments?: string;
  approvedBy?: string;
  decidedAtUtc?: string;
}

export interface ResourceApprovalRequest {
  approverId?: string;
  status: number;
  comments?: string;
}

// ── Helpers ──

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

// ── Resource CRUD ──

export const resourceService = {
  getAll: async (): Promise<Resource[]> => {
    const response = await projectManagementApiClient.get('/Resources');
    const result = extractPayload<Resource[]>(response);
    return Array.isArray(result) ? result : [];
  },

  getById: async (id: string): Promise<Resource> => {
    const response = await projectManagementApiClient.get(`/Resources/${id}`);
    return extractPayload<Resource>(response);
  },

  create: async (payload: ResourceCreateDTO): Promise<Resource> => {
    const response = await projectManagementApiClient.post('/Resources', payload);
    return extractPayload<Resource>(response);
  },

  update: async (id: string, payload: ResourceUpdateDTO): Promise<Resource | void> => {
    const response = await projectManagementApiClient.put(`/Resources/${id}`, payload);
    return extractPayload<Resource | void>(response);
  },

  delete: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Resources/${id}`);
  },
};

// ── Resource Request CRUD ──

export const resourceRequestService = {
  getAll: async (projectId?: string): Promise<ResourceRequest[]> => {
    const params = projectId ? { projectId } : {};
    const response = await projectManagementApiClient.get('/Resources/requests', { params });
    const result = extractPayload<ResourceRequest[]>(response);
    return Array.isArray(result) ? result : [];
  },

  getById: async (id: string): Promise<ResourceRequest> => {
    const response = await projectManagementApiClient.get(`/Resources/requests/${id}`);
    return extractPayload<ResourceRequest>(response);
  },

  create: async (payload: ResourceRequestCreateDTO): Promise<ResourceRequest> => {
    const response = await projectManagementApiClient.post('/Resources/requests', payload);
    return extractPayload<ResourceRequest>(response);
  },

  update: async (id: string, payload: ResourceRequestUpdateDTO): Promise<ResourceRequest | void> => {
    const response = await projectManagementApiClient.put(`/Resources/requests/${id}`, payload);
    return extractPayload<ResourceRequest | void>(response);
  },

  delete: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Resources/requests/${id}`);
  },

  approve: async (requestId: string, payload: ResourceApprovalRequest): Promise<void> => {
    await projectManagementApiClient.post(`/Projects/resource-requests/${requestId}/approve`, payload);
  },
};

export default resourceService;
