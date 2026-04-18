import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useTimeline(childId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['timeline', childId],
    queryFn: ({ pageParam }) => api.diary.timeline(childId!, pageParam as string | undefined),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!childId,
  });
}
