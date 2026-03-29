import { useQuery } from '@tanstack/react-query';
import { listStageEntries } from '../api/stageEntriesApi';

export const stageEntriesQueryKey = (opportunityId: string) => ['stage-entries', opportunityId] as const;

export function useStageEntries(opportunityId: string | undefined) {
  return useQuery({
    queryKey: opportunityId ? stageEntriesQueryKey(opportunityId) : ['stage-entries', ''],
    queryFn: () => listStageEntries(opportunityId!),
    enabled: Boolean(opportunityId),
  });
}
