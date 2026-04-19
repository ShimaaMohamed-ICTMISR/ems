import apiClient from './apiClient';

const extractApiErrorMessage = (error: any, fallback: string): string => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors.join(', ');
  }

  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentRoleId?: string | null;
  isActive: boolean;
  permissions?: Permission[];
  permissionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleDto {
  code: string;
  name: string;
  description?: string;
  parentRoleId?: string | null;
  isActive: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  parentRoleId?: string | null;
  isActive?: boolean;
}

export interface AssignPermissionsDto {
  permissionCodes: string[];
  replaceExisting: boolean;
}

export interface GetRolesParams {
  activeOnly?: boolean;
  searchTerm?: string;
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

// Get all roles with pagination
export const getAllRoles = async (params?: GetRolesParams): Promise<Role[]> => {
  try {
    // If no params, fetch all with large page size
    const queryParams = params || { pageNumber: 1, pageSize: 1000 };
    const response = await apiClient.get<PaginatedResponse<Role>>('/Role', { 
      params: queryParams 
    });
    
    // Return items array from paginated response
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// Get roles with pagination metadata
export const getRolesPaginated = async (params?: GetRolesParams): Promise<PaginatedResponse<Role>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<Role>>('/Role', { 
      params 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// Get role by ID
export const getRoleById = async (id: string): Promise<Role> => {
  const response = await apiClient.get(`/Role/${id}`);
  return response.data;
};

// Get role permissions by role ID
export const getRolePermissions = async (id: string): Promise<Permission[]> => {
  const response = await apiClient.get(`/Role/${id}/permissions`);
  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.permissions)) return data.permissions;

  return [];
};

// Create a new role
export const createRole = async (data: CreateRoleDto): Promise<Role> => {
  const response = await apiClient.post('/Role', data);
  return response.data;
};

// Update a role
export const updateRole = async (id: string, data: UpdateRoleDto): Promise<Role> => {
  const response = await apiClient.put(`/Role/${id}`, data);
  return response.data;
};

// Delete a role
export const deleteRole = async (id: string): Promise<void> => {
  await apiClient.delete(`/Role/${id}`);
};

// Assign permissions to a role
export const assignPermissionsToRole = async (
  roleId: string,
  data: AssignPermissionsDto
): Promise<Role> => {
  try {
    const response = await apiClient.put(`/Role/${roleId}/permissions`, data);
    return response.data;
  } catch (error: any) {
    const message = extractApiErrorMessage(
      error,
      'Failed to assign role permissions.',
    );
    throw new Error(message);
  }
};

// Remove a permission from a role
export const removePermissionFromRole = async (
  roleId: string,
  permissionId: string
): Promise<void> => {
  await apiClient.delete(`/Role/${roleId}/permissions/${permissionId}`);
};

// Get role hierarchy
export const getRoleHierarchy = async (id: string): Promise<Role> => {
  const response = await apiClient.get(`/Role/${id}/hierarchy`);
  return response.data;
};
