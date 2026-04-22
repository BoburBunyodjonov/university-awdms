import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  AcademicTerm,
  CreateGroupInput,
  Group,
  Language,
  StudyLevel,
  UpdateGroupInput,
} from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { Paginated } from '@/features/teachers/api';

export interface GroupsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  directionId?: string;
  language?: Language;
  level?: StudyLevel;
  academicTerm?: AcademicTerm;
  courseYear?: number;
}

export interface GroupWithDirection extends Group {
  direction: { id: string; name: string; code: string };
}

const key = (q: GroupsQuery = {}) => ['groups', q] as const;

export function useGroups(
  query: GroupsQuery = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery<Paginated<GroupWithDirection>>({
    queryKey: key(query),
    queryFn: async () => {
      const { data } = await api.get<Paginated<GroupWithDirection>>('/groups', {
        params: query,
      });
      return data;
    },
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useCreateGroup() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      const { data } = await api.post<GroupWithDirection>('/groups', input);
      return data;
    },
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success(t('toasts.created', { name: g.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateGroup(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateGroupInput) => {
      const { data } = await api.patch<GroupWithDirection>(
        `/groups/${id}`,
        input,
      );
      return data;
    },
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success(t('toasts.updated', { name: g.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteGroup() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/groups/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success(t('toasts.deleted'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
