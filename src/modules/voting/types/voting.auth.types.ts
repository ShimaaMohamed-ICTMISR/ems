/**
 * Voting Service Authentication Types
 * Represents the authenticated user context for Voting-Service
 */

export interface VotingAuthUser {
  id: string;
  username?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
}

export interface VotingAuthState {
  user: VotingAuthUser | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface AuthMeResponse {
  id: string;
  username?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  userId?: string; // Alternative field name
}
