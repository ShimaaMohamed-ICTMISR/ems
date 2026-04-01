import projectManagementApiClient from './projectManagementApiClient';

export interface MilestoneApproval {
  id: string;
  milestoneId: string;
  approverId?: string | null;
  status?: number;
  comments?: string | null;
  decidedAtUtc?: string | null;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface MilestoneApprovalCreateDTO {
  milestoneId: string;
  approverId: string;
  status?: number;
  comments?: string | null;
  decidedAtUtc?: string | null;
}

export interface MilestoneApprovalUpdateDTO {
  milestoneId: string;
  approverId: string;
  status?: number;
  comments?: string | null;
  decidedAtUtc?: string | null;
  id?: string;
  rowVersion: string;
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

export const milestoneApprovalService = {
  getApprovalsByMilestoneId: async (milestoneId: string): Promise<MilestoneApproval[]> => {
    const response = await projectManagementApiClient.get('/Milestones/approvals', {
      params: { milestoneId },
    });
    const result = extractPayload<MilestoneApproval[]>(response);
    return Array.isArray(result) ? result : [];
  },

  createApproval: async (payload: MilestoneApprovalCreateDTO): Promise<MilestoneApproval> => {
    const response = await projectManagementApiClient.post('/Milestones/approvals', payload);
    return extractPayload<MilestoneApproval>(response);
  },

  getApprovalById: async (id: string): Promise<MilestoneApproval> => {
    const response = await projectManagementApiClient.get(`/Milestones/approvals/${id}`);
    return extractPayload<MilestoneApproval>(response);
  },

  updateApprovalById: async (
    id: string,
    payload: MilestoneApprovalUpdateDTO,
  ): Promise<MilestoneApproval | void> => {
    const response = await projectManagementApiClient.put(`/Milestones/approvals/${id}`, payload);
    return extractPayload<MilestoneApproval | void>(response);
  },

  deleteApprovalById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Milestones/approvals/${id}`);
  },
};

export default milestoneApprovalService;
