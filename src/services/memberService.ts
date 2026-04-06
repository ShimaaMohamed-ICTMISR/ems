import projectManagementApiClient from './projectManagementServices/projectManagementApiClient';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  fullName: string;
  role: string;
  allocationPercentage?: number;
  effectiveFromUtc?: string | null;
  effectiveToUtc?: string | null;
  rowVersion?: string | null;
}

export interface MemberCreateDTO {
  projectId: string;
  userId: string;
  fullName: string;
  role: string;
  allocationPercentage?: number;
  effectiveFromUtc?: string;
  effectiveToUtc?: string;
}

export interface MemberUpdateDTO {
  id: string;
  projectId: string;
  userId: string;
  fullName: string;
  role: string;
  rowVersion: string;
  allocationPercentage?: number;
  effectiveFromUtc?: string;
  effectiveToUtc?: string;
}

function extractMembers(data: unknown): ProjectMember[] {
  if (Array.isArray(data)) return data as ProjectMember[];
  const d = data as { value?: ProjectMember[]; data?: { data?: ProjectMember[] } | ProjectMember[] };
  if (d && typeof d === 'object') {
    if (Array.isArray((d as { value?: unknown }).value)) return (d as { value: ProjectMember[] }).value;
    if (d.data && typeof d.data === 'object' && 'data' in d.data && Array.isArray(d.data.data)) return d.data.data;
    if (Array.isArray(d.data)) return d.data as ProjectMember[];
  }
  return [];
}

function extractMember(data: unknown): ProjectMember {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (d.value && typeof d.value === 'object') return d.value as ProjectMember;
    if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) return d.data as ProjectMember;
  }
  return data as ProjectMember;
}

export const memberService = {
  getProjectMembers: async (projectId?: string): Promise<ProjectMember[]> => {
    const response = await projectManagementApiClient.get('/project-admin/members', {
      params: projectId ? { projectId } : undefined,
    });
    return extractMembers(response.data);
  },

  getMemberById: async (id: string): Promise<ProjectMember> => {
    const response = await projectManagementApiClient.get(`/project-admin/members/${id}`);
    return extractMember(response.data);
  },

  createProjectMember: async (payload: MemberCreateDTO): Promise<ProjectMember> => {
    const response = await projectManagementApiClient.post('/project-admin/members', payload);
    return response.data as ProjectMember;
  },

  updateMember: async (id: string, payload: MemberUpdateDTO): Promise<ProjectMember | void> => {
    const response = await projectManagementApiClient.put(`/project-admin/members/${id}`, payload);
    return response.data as ProjectMember | void;
  },

  deleteMember: async (id: string, rowVersion?: string): Promise<void> => {
    await projectManagementApiClient.delete(`/project-admin/members/${id}`, {
      data: rowVersion ? { rowVersion } : undefined,
    });
  },
};

export default memberService;
