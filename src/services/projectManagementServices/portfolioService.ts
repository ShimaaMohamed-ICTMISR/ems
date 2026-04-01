import projectManagementApiClient from './projectManagementApiClient';

export interface PortfolioProject {
  id: string;
  name?: string | null;
  stage?: number;
  healthStatus?: number;
  startDateUtc?: string;
  endDateUtc?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string | null;
  portfolioManagerId?: string | null;
  rowVersion?: string | null;
  projects?: PortfolioProject[] | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface PortfolioCreateDTO {
  name: string;
  description?: string;
  portfolioManagerId?: string;
}

export interface PortfolioUpdateDTO {
  id: string;
  name: string;
  description?: string;
  portfolioManagerId?: string;
  rowVersion: string;
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

export const portfolioService = {
  getPortfolios: async (): Promise<Portfolio[]> => {
    const response = await projectManagementApiClient.get('/project-admin/portfolios');
    return extractPayload<Portfolio[]>(response) || [];
  },

  createPortfolio: async (payload: PortfolioCreateDTO): Promise<Portfolio> => {
    const response = await projectManagementApiClient.post('/project-admin/portfolios', payload);
    return extractPayload<Portfolio>(response);
  },

  getPortfolioById: async (id: string): Promise<Portfolio> => {
    const response = await projectManagementApiClient.get(`/project-admin/portfolios/${id}`);
    return extractPayload<Portfolio>(response);
  },

  updatePortfolioById: async (id: string, payload: PortfolioUpdateDTO): Promise<Portfolio | void> => {
    const response = await projectManagementApiClient.put(`/project-admin/portfolios/${id}`, payload);
    return extractPayload<Portfolio | void>(response);
  },

  deletePortfolioById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/project-admin/portfolios/${id}`);
  },
};

export default portfolioService;
