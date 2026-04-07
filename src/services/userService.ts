import apiClient from './apiClient';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  mfaEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  roles?: UserRole[];
}

export interface UserRole {
  roleId: string;
  roleName?: string;
  roleCode?: string;
  expiresAt?: string;
  notes?: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirmation: string;
  phoneNumber?: string;
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface AssignRoleDto {
  roleId: string;
  expiresAt?: string;
  notes?: string;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface GetUsersParams {
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

// Get all users with pagination and filters
export const getUsers = async (params?: GetUsersParams): Promise<PaginatedResponse<User>> => {
  try {
    const response = await apiClient.get('/User', { params });
    
    // Log the response in development
    if (import.meta.env.DEV) {
      console.log('API Response for /User:', response.data);
    }
    
    // Return the paginated response
    return response.data;
  } catch (error) {
    console.error('Error in getUsers:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get(`/User/${id}`);
  return response.data;
};

// Create a new user
export const createUser = async (data: CreateUserDto): Promise<User> => {
  const response = await apiClient.post('/User', data);
  return response.data;
};

// Update a user
export const updateUser = async (id: string, data: UpdateUserDto): Promise<User> => {
  const response = await apiClient.put(`/User/${id}`, data);
  return response.data;
};

// Delete a user
export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/User/${id}`);
};

// Reactivate a user
export const reactivateUser = async (id: string): Promise<void> => {
  await apiClient.post(`/User/${id}/reactivate`);
};

// Toggle MFA for a user
export const toggleUserMfa = async (id: string): Promise<void> => {
  await apiClient.post(`/User/${id}/toggle-mfa`);
};

// Assign role to user
export const assignRoleToUser = async (userId: string, data: AssignRoleDto): Promise<void> => {
  // Only send non-empty fields to avoid validation errors
  const payload: any = {
    roleId: data.roleId
  };
  
  if (data.expiresAt && data.expiresAt.trim()) {
    payload.expiresAt = data.expiresAt;
  }
  
  if (data.notes && data.notes.trim()) {
    payload.notes = data.notes;
  }
  
  await apiClient.post(`/User/${userId}/roles`, payload);
};

// Remove role from user
export const removeRoleFromUser = async (userId: string, roleId: string): Promise<void> => {
  await apiClient.delete(`/User/${userId}/roles/${roleId}`);
};

// Get user sessions
export const getUserSessions = async (userId: string): Promise<UserSession[]> => {
  const response = await apiClient.get(`/User/${userId}/sessions`);
  return response.data;
};

// Revoke a session
export const revokeSession = async (sessionId: string): Promise<void> => {
  await apiClient.post(`/User/sessions/${sessionId}/revoke`);
};
