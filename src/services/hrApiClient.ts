import axios from 'axios';

// HR Service specific base URL
const HR_API_BASE_URL =
  import.meta.env.VITE_HR_API_BASE_URL ??
  'https://ems-human-resources-management-service.onrender.com/api/hr';

/** HR ticket must win over global VITE_SERVICE_TICKET (voting/opportunity), else wrong ticket → 401. */
const HR_SERVICE_TICKET =
  import.meta.env.VITE_HR_SERVICE_TICKET ??
  import.meta.env.VITE_SERVICE_TICKET ??
  import.meta.env.VITE_SERVICE_TICKET_KEY ??
  import.meta.env.VITE_OPPORTUNITY_SERVICE_TICKET ??
  'TEST-SECRET-TICKET-2026';

export const hrApiClient = axios.create({
  baseURL: HR_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

hrApiClient.interceptors.request.use(
  (config) => {
    config.headers = config.headers ?? {};
    if (HR_SERVICE_TICKET) {
      config.headers['X-Service-Ticket'] = HR_SERVICE_TICKET;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// IMPORTANT:
// HR service uses X-Service-Ticket for inter-service auth.
// Sending the app's Bearer token can cause the gateway to reject the request even when the service ticket is valid.
// So we do NOT attach Authorization for HR requests.
hrApiClient.interceptors.request.use(
  (config) => {
    try {
      if (config.data) console.debug('HR API Request body:', config.data);
    } catch {
      console.debug('HR API Request body: <unserializable>');
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// HR 401 ≠ IAM session invalid: do not clear auth or redirect.
hrApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      console.debug('HR API Error response:', error.response?.data);
    } catch {
      console.debug('HR API Error response: <unserializable>');
    }
    return Promise.reject(error);
  },
);

export default hrApiClient;
