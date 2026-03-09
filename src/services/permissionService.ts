import { apiClient } from './apiClient';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  resourceType?: string;
  action?: string;
  category?: string;
  isSystemPermission?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface GetPermissionsParams {
  category?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const permissionService = {
  getAllPermissions: async (params?: GetPermissionsParams): Promise<Permission[]> => {
    try {
      // If no params, fetch all with large page size
      const queryParams = params || { pageNumber: 1, pageSize: 1000 };
      const response = await apiClient.get<PaginatedResponse<Permission>>('/Permission', { 
        params: queryParams 
      });
      
      // Return items array from paginated response
      return response.data.items || [];
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch permissions.';
      throw new Error(errorMessage);
    }
  },

  getPermissionsPaginated: async (params?: GetPermissionsParams): Promise<PaginatedResponse<Permission>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Permission>>('/Permission', { 
        params 
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch permissions.';
      throw new Error(errorMessage);
    }
  },

  getPermissionById: async (id: string): Promise<Permission> => {
    try {
      const response = await apiClient.get<Permission>(`/Permission/${id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch permission.';
      throw new Error(errorMessage);
    }
  },

  getPermissionsByResource: async (resourceType: string): Promise<Permission[]> => {
    try {
      const response = await apiClient.get<Permission[]>(`/Permission/resource/${resourceType}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch permissions by resource.';
      throw new Error(errorMessage);
    }
  },

  getPermissionCategories: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<string[]>('/Permission/categories');
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch permission categories.';
      throw new Error(errorMessage);
    }
  },
};
