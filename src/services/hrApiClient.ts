import axios from 'axios';

// HR Service specific base URL
const HR_API_BASE_URL = import.meta.env.DEV 
  ? '/api/hr' 
  : 'https://ems-human-resources-management-service.onrender.com/api/hr';

export const hrApiClient = axios.create({
  baseURL: HR_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Ticket': 'auH2RtYi9df5vO79WXl5XyaUck6GNwClJ54ayehPU9A=',
  },
});

// Add token to requests if available
hrApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('HR API Request to:', config.url, 'with token:', token.substring(0, 20) + '...');
    } else {
      console.warn('No auth token found in localStorage for HR API request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
hrApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized! HR Service token may be invalid or expired.');
      // Clear invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default hrApiClient;
