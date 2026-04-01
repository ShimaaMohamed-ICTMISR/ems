import axios from 'axios';

const PROJECT_MANAGEMENT_API_BASE_URL = 'http://apigetway.runasp.net/api/projectmanagement/api/';
  // import.meta.env.VITE_PROJECT_MANAGEMENT_API_URL ||
  // (import.meta.env.DEV
  //   ? 'http://apigetway.runasp.net/api/projectmanagement/api/'
  //   : 'http://apigetway.runasp.net/api/projectmanagement/api/');

// const SERVICE_TICKET = import.meta.env.VITE_PROJECT_MANAGEMENT_SERVICE_TICKET || 'TEST-SECRET-TICKET-2026';

export const projectManagementApiClient = axios.create({
  baseURL: PROJECT_MANAGEMENT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

projectManagementApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // if (SERVICE_TICKET) {
    //   config.headers['X-Service-Ticket'] = SERVICE_TICKET;
    // }

    return config;
  },
  (error) => Promise.reject(error),
);

export default projectManagementApiClient;
