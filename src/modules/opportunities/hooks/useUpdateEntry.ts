import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStageEntry } from '../api/stageEntriesApi';
import type { UpdateOpportunityStageEntryDto } from '../types/opportunity.types';
import { stageEntriesQueryKey } from './useStageEntries';

export function useUpdateEntry(opportunityId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { entryId: string; body: UpdateOpportunityStageEntryDto }) =>
      updateStageEntry(opportunityId!, args.entryId, args.body),
    onSuccess: () => {
      if (opportunityId) {
        void queryClient.invalidateQueries({ queryKey: stageEntriesQueryKey(opportunityId) });
      }
    },
  });
}
