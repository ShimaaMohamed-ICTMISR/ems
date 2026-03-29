import axios from 'axios';

// HR Service specific base URL
const HR_API_BASE_URL = import.meta.env.DEV 
  ? '/api/hr' 
  : 'https://ems-human-resources-management-service.onrender.com/api/hr';

const HR_SERVICE_TICKET =
  import.meta.env.VITE_SERVICE_TICKET ??
  import.meta.env.VITE_SERVICE_TICKET_KEY ??
  import.meta.env.VITE_OPPORTUNITY_SERVICE_TICKET ??
  'TEST-SECRET-TICKET-2026'; // Fallback service ticket

export const hrApiClient = axios.create({
  baseURL: HR_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Ticket': HR_SERVICE_TICKET,
  },
});

// Add service ticket to all requests
hrApiClient.interceptors.request.use(
  (config) => {
    config.headers = config.headers ?? {};
    if (HR_SERVICE_TICKET) {
      config.headers['X-Service-Ticket'] = HR_SERVICE_TICKET;
    } else {
      console.warn('No HR service ticket configured!');
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add token to requests if available
hrApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No auth token found in localStorage for HR API request:', config.url);
    }
    // Log request body for debugging (temporary)
    try {
      if (config.data) console.debug('HR API Request body:', config.data);
    } catch (e) {
      console.debug('HR API Request body: <unserializable>');
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
    const status = error.response?.status;
    // Log response error body for debugging
    try {
      console.error('HR API Error response:', error.response?.data);
      console.error('HR API Error status:', status);
      console.error('HR API Error URL:', error.config?.url);
    } catch (e) {
      console.debug('HR API Error response: <unserializable>');
    }

    if (status === 401) {
      console.error('Unauthorized! HR Service token may be invalid or expired.');
      console.error('Current token:', localStorage.getItem('authToken')?.substring(0, 20) + '...');
      
      // Check if we have a token at all
      const hasToken = !!localStorage.getItem('authToken');
      if (!hasToken) {
        console.error('No auth token found - user needs to login');
      }
      
      // Clear invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default hrApiClient;
