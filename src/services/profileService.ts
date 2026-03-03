import { apiClient } from './apiClient';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles?: string[];
  createdAt?: string;
  lastLogin?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export const profileService = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get<UserProfile>('/Profile');
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch profile.';
      throw new Error(errorMessage);
    }
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    try {
      const response = await apiClient.put<UserProfile>('/Profile', data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update profile.';
      throw new Error(errorMessage);
    }
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/Profile/change-password', {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to change password.';
      throw new Error(errorMessage);
    }
  },
};

export default apiClient;
