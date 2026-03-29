import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteStageEntry } from '../api/stageEntriesApi';
import { stageEntriesQueryKey } from './useStageEntries';

export function useDeleteEntry(opportunityId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => deleteStageEntry(opportunityId!, entryId),
    onSuccess: () => {
      if (opportunityId) {
        void queryClient.invalidateQueries({ queryKey: stageEntriesQueryKey(opportunityId) });
      }
    },
  });
}
