/**
 * Hook to access voting service authenticated user
 */

import { useVotingAuth } from '../context/VotingAuthContext';

export function useVotingAuthUser() {
  const { user, isLoading, error, isInitialized } = useVotingAuth();
  
  return {
    user,
    isLoading,
    error,
    isInitialized,
    isAuthenticated: !!user?.id,
  };
}
