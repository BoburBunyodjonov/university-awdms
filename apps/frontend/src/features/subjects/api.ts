import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  CreateSubjectInput,
  StudyLevel,
  Subject,
  UpdateSubjectInput,
} from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { Paginated } from '@/features/teachers/api';

export interface SubjectsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  directionId?: string;
  level?: StudyLevel;
  isActive?: boolean;
}

export interface SubjectWithRelations extends Subject {
  direction: { id: string; name: string; code: string };
  _count: { offerings: number };
}

const key = (q: SubjectsQuery = {}) => ['subjects', q] as const;

export function useSubjects(query: SubjectsQuery = {}) {
  return useQuery<Paginated<SubjectWithRelations>>({
    queryKey: key(query),
    queryFn: async () => {
      const { data } = await api.get<Paginated<SubjectWithRelations>>(
        '/subjects',
        { params: query },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateSubject() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSubjectInput) => {
      const { data } = await api.post<SubjectWithRelations>(
        '/subjects',
        input,
      );
      return data;
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(t('toasts.created', { name: s.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateSubject(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSubjectInput) => {
      const { data } = await api.patch<SubjectWithRelations>(
        `/subjects/${id}`,
        input,
      );
      return data;
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(t('toasts.updated', { name: s.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteSubject() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subjects/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(t('toasts.deleted'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
