/**
 * Voting Service Authentication Service
 * Handles authentication with Voting-Service API
 */

import type { VotingAuthUser, AuthMeResponse } from '../types/voting.auth.types';

const AUTH_BASE_URL = 'http://apigetway.runasp.net/api/auth';

/**
 * Get headers for Voting-Service requests
 * Includes X-Service-Ticket and/or Authorization Bearer token
 */
export function getVotingServiceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add service ticket if available
  // const serviceTicket = getServiceTicket();
  // if (serviceTicket) {
  //   headers['X-Service-Ticket'] = serviceTicket;
  // }

  // Add authorization token if available
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Debug logging in dev mode
  if (import.meta.env.DEV) {
    console.debug('[VotingAuth] Request headers:', {
      hasBearer: !!authToken,
    });
  }

  return headers;
}

/**
 * Get service ticket from env or localStorage
 */
// function getServiceTicket(): string {
//   const fromEnv = (import.meta.env.VITE_VOTING_SERVICE_TICKET as string | undefined)?.trim();
//   if (fromEnv) return fromEnv;
//   const fromStorage = localStorage.getItem('voting-service-ticket')?.trim();
//   if (fromStorage) return fromStorage;
//   return 'TEST-SECRET-TICKET-2026';
// }

/**
 * Fetch current authenticated user from /auth/me
 */
export async function fetchCurrentVotingUser(): Promise<VotingAuthUser | null> {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.warn('[VotingAuth] No auth token found');
      return null;
    }

    const headers = getVotingServiceHeaders();
    const response = await fetch(`${AUTH_BASE_URL}/me`, { headers });

    if (response.status === 401) {
      console.warn('[VotingAuth] Unauthorized (401) - clearing auth state');
      clearVotingAuth();
      return null;
    }

    if (response.status === 404) {
      console.debug('[VotingAuth] Voting auth endpoint not available (404)');
      return null;
    }

    if (!response.ok) {
      console.error('[VotingAuth] Failed to fetch current user:', response.statusText);
      return null;
    }

    const data = (await response.json()) as AuthMeResponse;
    const user: VotingAuthUser = {
      id: data.id || data.userId || '',
      username: data.username,
      email: data.email,
      roles: data.roles,
      permissions: data.permissions,
    };

    if (import.meta.env.DEV) {
      console.debug('[VotingAuth] User loaded:', { id: user.id, username: user.username });
    }

    return user;
  } catch (error) {
    console.error('[VotingAuth] Error fetching current user:', error);
    return null;
  }
}

/**
 * Set service ticket in localStorage
 */
// export function setVotingServiceTicket(ticket: string): void {
//   if (ticket) {
//     localStorage.setItem('voting-service-ticket', ticket);
//   } else {
//     localStorage.removeItem('voting-service-ticket');
//   }
// }

/**
 * Clear voting auth state
 */
export function clearVotingAuth(): void {
  localStorage.removeItem('voting-service-ticket');
}

/**
 * Check if voting auth is ready
 * Returns true if we have either a service ticket or auth token
 */
export function isVotingAuthReady(): boolean {
  // const hasTicket = !!getServiceTicket();
  const hasToken = !!localStorage.getItem('authToken');
  return hasToken;
}
