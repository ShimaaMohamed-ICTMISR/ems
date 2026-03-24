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
}

function tryLocalDevLogin(credentials: LoginRequest): LoginResponse | null {
  const enabled =
    import.meta.env.DEV &&
    String(import.meta.env.VITE_USE_LOCAL_LOGIN).toLowerCase() === 'true';

  if (!enabled) return null;

  const expectedUser = (import.meta.env.VITE_LOCAL_LOGIN_USERNAME ?? '').trim();
  const expectedPass = import.meta.env.VITE_LOCAL_LOGIN_PASSWORD ?? '';

  if (!expectedUser || !expectedPass) {
    console.warn(
      '[auth] VITE_USE_LOCAL_LOGIN is true but VITE_LOCAL_LOGIN_USERNAME or VITE_LOCAL_LOGIN_PASSWORD is missing.',
    );
    return null;
  }

  const id = credentials.usernameOrEmail.trim();
  if (id !== expectedUser || credentials.password !== expectedPass) {
    throw new Error('Invalid username or password.');
  }

  return {
    accessToken: 'local-dev-token',
    refreshToken: 'local-dev-refresh',
    tokenType: 'Bearer',
    expiresIn: 86400,
    user: {
      id: 'local-user',
      email: `${expectedUser}@local.dev`,
      username: expectedUser,
      fullName: 'Local User',
    },
    mfaRequired: false,
  };
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const local = tryLocalDevLogin(credentials);
      if (local) return local;

      const response = await apiClient.post<LoginResponse>('/Auth/login', credentials);
      return response.data;
    } catch (error: any) {
      // Preserve messages from local dev login (no axios response)
      if (error?.message && !error?.response) {
        throw error instanceof Error ? error : new Error(String(error.message));
      }
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.errors?.UsernameOrEmail?.[0] ||
        'Login failed. Please try again.';
      throw new Error(errorMessage);
    }
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (token === 'local-dev-token') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return;
    }
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
    }
  },

  getToken: () => localStorage.getItem('authToken'),

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default apiClient;
