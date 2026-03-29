/**
 * Central HTTP client for Opportunity Management Service.
 * Security: service ticket and auth token are never logged.
 */
import axios, { type AxiosError, type AxiosInstance } from 'axios';

/**
 * Resolves Opportunity Management API base (must end with /api/v1).
 *
 * IMPORTANT: Do not reuse `VITE_API_BASE_URL` here — many apps set it to another microservice
 * (e.g. voting/IAM), which would send opportunity calls to the wrong host and break auth.
 * Use `VITE_OPPORTUNITY_API_BASE_URL` (or `NEXT_PUBLIC_OPPORTUNITY_API_BASE_URL`) for this service only.
 */
function resolveOpportunityManagementBaseUrl(): string {
  const explicit =
    import.meta.env.VITE_OPPORTUNITY_API_BASE_URL ?? import.meta.env.NEXT_PUBLIC_OPPORTUNITY_API_BASE_URL;
  if (explicit && String(explicit).trim()) return normalizeApiV1Base(String(explicit).trim());

  return 'https://ems-opportunity-management-service.onrender.com/api/v1';
}

function normalizeApiV1Base(raw: string): string {
  let u = raw.replace(/\/+$/, '');
  if (u.endsWith('/api')) return `${u}/v1`;
  if (/\/api\/v1$/i.test(u)) return u;
  if (u.endsWith('/v1')) return u;
  if (!u.includes('/api')) return `${u}/api/v1`;
  return u;
}

const BASE_URL = resolveOpportunityManagementBaseUrl();

/** Service ticket for Opportunity Management API only (header: X-Service-Ticket). */
function resolveOpportunityServiceTicket(): string {
  const candidates = [
    import.meta.env.VITE_OPPORTUNITY_SERVICE_TICKET,
    import.meta.env.VITE_SERVICE_TICKET,
    import.meta.env.VITE_SERVICE_TICKET_KEY,
  ];
  for (const raw of candidates) {
    const s = raw == null ? '' : String(raw).trim();
    if (s) return s;
  }
  return '';
}

const TENANT_ID =
  import.meta.env.VITE_TENANT_ID ?? import.meta.env.VITE_X_TENANT_ID ?? '';

export const opportunityManagementClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

opportunityManagementClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const ticket = resolveOpportunityServiceTicket();
  if (ticket) {
    config.headers['X-Service-Ticket'] = ticket;
  }
  if (TENANT_ID) {
    config.headers['X-Tenant-Id'] = TENANT_ID;
  }
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalize API errors for UI — never includes secrets */
export function extractOpportunityApiError(error: unknown): string {
  const err = error as AxiosError<{
    message?: string | string[];
    error?: string;
    errors?: Record<string, string[]>;
    statusCode?: number;
  }>;

  const status = err.response?.status;
  const data = err.response?.data;
  const rawData: unknown = err.response?.data;

  if (data?.message) {
    const m = data.message;
    if (Array.isArray(m)) return m.join('. ');
    return String(m);
  }
  // Plain string body (some gateways / proxies)
  if (typeof rawData === 'string' && rawData.trim()) return rawData.trim();
  if (data?.error) return String(data.error);
  if (data?.errors && typeof data.errors === 'object') {
    const parts = Object.entries(data.errors).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((x) => `${k}: ${x}`) : [`${k}: ${v}`],
    );
    if (parts.length) return parts.join('; ');
  }
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 401) return 'Authentication failed. Please sign in again.';
  if (status === 409) return 'This action conflicts with the current state. Please refresh and try again.';
  if (status === 422) return 'Validation failed. Please check your input.';
  if (status === 500) {
    return 'Server error while processing the request. If this persists, the opportunity service may need a fix — check Network tab response body or service logs.';
  }
  if (err.message && !err.response) return err.message;
  return 'Request failed. Please try again.';
}

export interface ApiEnvelope<T> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
}

export function unwrapEntity<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
    const e = raw as ApiEnvelope<T>;
    if (e.data !== undefined) return e.data as T;
  }
  return raw as T;
}

export function unwrapList<T>(raw: unknown): T[] {
  const inner = unwrapEntity<unknown>(raw);
  if (Array.isArray(inner)) return inner as T[];
  if (inner && typeof inner === 'object' && Array.isArray((inner as { data?: T[] }).data)) {
    return (inner as { data: T[] }).data;
  }
  return [];
}

export function unwrapPaginated<T>(
  raw: unknown,
  defaultLimit = 20,
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const layer = unwrapEntity<Record<string, unknown>>(raw);
  const list = Array.isArray(layer)
    ? (layer as T[])
    : Array.isArray(layer?.data)
      ? (layer.data as T[])
      : [];

  const total =
    typeof layer?.total === 'number' ? layer.total : list.length;
  const page = typeof layer?.page === 'number' ? layer.page : 1;
  const limit =
    typeof layer?.limit === 'number' ? layer.limit : list.length || defaultLimit;
  const totalPages =
    typeof layer?.totalPages === 'number'
      ? layer.totalPages
      : limit > 0
        ? Math.max(1, Math.ceil(total / limit))
        : 1;

  return { items: list, total, page, limit, totalPages };
}
