import axios from 'axios';

// Use relative path for proxy in development, or full URL for production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api' 
  : 'http://iamauth.runasp.net/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No auth token found in localStorage for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 and 403 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized! Token may be invalid or expired.');
      // Clear invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.warn('Access denied (403): User lacks required permissions for:', error.config?.url);
      // Create a more user-friendly error message
      const originalMessage = error.response?.data?.message || 'Access denied';
      error.message = `Access Denied: ${originalMessage}`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
