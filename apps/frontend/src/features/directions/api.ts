import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  CreateDirectionInput,
  Direction,
  StudyLevel,
} from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

export interface DirectionsQuery {
  search?: string;
  level?: StudyLevel;
}

export interface DirectionWithCounts extends Direction {
  _count: { groups: number; subjects: number };
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

const key = (q: DirectionsQuery = {}) => ['directions', q] as const;

export function useDirections(query: DirectionsQuery = {}) {
  return useQuery<ListResponse<DirectionWithCounts>>({
    queryKey: key(query),
    queryFn: async () => {
      const { data } = await api.get<ListResponse<DirectionWithCounts>>(
        '/directions',
        { params: query },
      );
      return data;
    },
    staleTime: 600_000,
  });
}

export function useCreateDirection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDirectionInput) => {
      const { data } = await api.post<Direction>('/directions', input);
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['directions'] });
      toast.success(t('toasts.created', { name: d.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateDirection(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateDirectionInput>) => {
      const { data } = await api.patch<Direction>(`/directions/${id}`, input);
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['directions'] });
      toast.success(t('toasts.updated', { name: d.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteDirection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/directions/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['directions'] });
      toast.success(t('toasts.deleted'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
