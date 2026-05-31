// Shared TanStack Query client.
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Centralized query keys so screens and mutations invalidate consistently.
export const qk = {
  groups: ['groups'] as const,
  group: (id: string) => ['group', id] as const,
  groupData: (id: string) => ['group', id, 'data'] as const,
  members: (id: string) => ['group', id, 'members'] as const,
  activity: ['activity'] as const,
  profile: (id: string) => ['profile', id] as const,
};
