/**
 * Voting Service Authentication Context
 * Manages authenticated user state for Voting-Service
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { VotingAuthUser, VotingAuthState } from '../types/voting.auth.types';
import { fetchCurrentVotingUser, clearVotingAuth } from '../services/votingAuthService';

interface VotingAuthContextType extends VotingAuthState {
  initializeAuth: () => Promise<void>;
  logout: () => void;
}

const VotingAuthContext = createContext<VotingAuthContextType | undefined>(undefined);

export function VotingAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VotingAuthState>({
    user: null,
    isLoading: false,
    error: null,
    isInitialized: false,
  });

  const initializeAuth = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await fetchCurrentVotingUser();
      setState((prev) => ({
        ...prev,
        user,
        isInitialized: true,
        isLoading: false,
        error: user ? null : 'Failed to load user',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const logout = () => {
    clearVotingAuth();
    setState({
      user: null,
      isLoading: false,
      error: null,
      isInitialized: true,
    });
  };

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <VotingAuthContext.Provider
      value={{
        ...state,
        initializeAuth,
        logout,
      }}
    >
      {children}
    </VotingAuthContext.Provider>
  );
}

export function useVotingAuth() {
  const context = useContext(VotingAuthContext);
  if (!context) {
    throw new Error('useVotingAuth must be used within VotingAuthProvider');
  }
  return context;
}
