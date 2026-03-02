import { apiClient } from './apiClient';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  category?: string;
  isActive: boolean;
  createdAt?: string;
}

export const permissionService = {
  getAllPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await apiClient.get<Permission[]>('/Permission');
      return response.data;
    } catch (error: any) {
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
