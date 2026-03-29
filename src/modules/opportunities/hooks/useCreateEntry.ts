import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStageEntry } from '../api/stageEntriesApi';
import type { CreateOpportunityStageEntryDto } from '../types/opportunity.types';
import { stageEntriesQueryKey } from './useStageEntries';

export function useCreateEntry(opportunityId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOpportunityStageEntryDto) => createStageEntry(opportunityId!, body),
    onSuccess: () => {
      if (opportunityId) {
        void queryClient.invalidateQueries({ queryKey: stageEntriesQueryKey(opportunityId) });
      }
    },
  });
}
