import axios from 'axios';

const PROJECT_MANAGEMENT_API_BASE_URL = import.meta.env.DEV
  ? '/api/project-management'
  : 'http://apigetway.runasp.net/api/projectmanagement/api/';

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

    return config;
  },
  (error) => Promise.reject(error),
);

export default projectManagementApiClient;
