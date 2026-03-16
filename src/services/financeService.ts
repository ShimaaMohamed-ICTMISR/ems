import projectManagementApiClient from './projectManagementApiClient';

export interface Budget {
  id: string;
  projectId: string;
  category?: number;
  plannedAmount?: number;
  actualAmount?: number;
  forecastAmount?: number;
  rowVersion?: string | null;
  createdDateUtc?: string;
  updatedDateUtc?: string | null;
}

export interface BudgetCreateDTO {
  projectId: string;
  category: number;
  plannedAmount?: number;
  actualAmount?: number;
  forecastAmount?: number;
}

export interface BudgetUpdateDTO {
  id: string;
  projectId: string;
  rowVersion: string;
  category: number;
  plannedAmount?: number;
  actualAmount?: number;
  forecastAmount?: number;
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

export const financeService = {
  getBudgets: async (projectId?: string): Promise<Budget[]> => {
    const params = projectId ? { projectId } : {};
    const response = await projectManagementApiClient.get('/Finance/budgets', {
      params,
    });
    const result = extractPayload<Budget[]>(response);
    return Array.isArray(result) ? result : [];
  },

  createBudget: async (payload: BudgetCreateDTO): Promise<Budget> => {
    const response = await projectManagementApiClient.post(
      '/Finance/budgets',
      payload,
    );
    return extractPayload<Budget>(response);
  },

  getBudgetById: async (id: string): Promise<Budget> => {
    const response = await projectManagementApiClient.get(`/Finance/budgets/${id}`);
    return extractPayload<Budget>(response);
  },

  updateBudgetById: async (
    id: string,
    payload: BudgetUpdateDTO,
  ): Promise<Budget | void> => {
    const response = await projectManagementApiClient.put(
      `/Finance/budgets/${id}`,
      payload,
    );
    return extractPayload<Budget | void>(response);
  },

  deleteBudgetById: async (id: string): Promise<void> => {
    await projectManagementApiClient.delete(`/Finance/budgets/${id}`);
  },
};

export default financeService;
