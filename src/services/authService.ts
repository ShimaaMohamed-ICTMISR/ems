import { apiClient } from './apiClient';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    roles?: any[];
    permissions?: any[];
  };
  mfaRequired: boolean;
  mfaToken?: string;
  // Service tickets for different services
  votingServiceTicket?: string;
  meetingServiceTicket?: string;
  opportunityServiceTicket?: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/Auth/login', credentials);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.errors?.UsernameOrEmail?.[0] ||
        'Login failed. Please try again.';
      throw new Error(errorMessage);
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Call the logout API endpoint to invalidate the token on backend
      await apiClient.post('/Auth/logout', {});
    } catch (error: any) {
      // Even if API call fails, clear local storage
      console.error('Logout API call failed:', error.message);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Clear service tickets on logout
      localStorage.removeItem('voting-service-ticket');
      localStorage.removeItem('meeting-service-ticket');
      localStorage.removeItem('opportunity-service-ticket');
    }
  },

  getToken: () => localStorage.getItem('authToken'),

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default apiClient;
