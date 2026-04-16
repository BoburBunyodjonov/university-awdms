import { useQuery } from '@tanstack/react-query';
import type { User } from '@awdms/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me');
      return data;
    },
  });
}
