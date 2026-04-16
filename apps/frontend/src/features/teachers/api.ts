import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  CreateTeacherInput,
  Teacher,
  UpdateTeacherInput,
} from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

export interface TeachersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  hasScientificDegree?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const teachersKey = (q: TeachersQuery = {}) => ['teachers', q] as const;

export function useTeachers(query: TeachersQuery = {}) {
  return useQuery<Paginated<Teacher>>({
    queryKey: teachersKey(query),
    queryFn: async () => {
      const { data } = await api.get<Paginated<Teacher>>('/teachers', {
        params: query,
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateTeacher() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTeacherInput) => {
      const { data } = await api.post<Teacher>('/teachers', input);
      return data;
    },
    onSuccess: (teacher) => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success(t('toasts.created', { name: teacher.fullName }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateTeacher(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTeacherInput) => {
      const { data } = await api.patch<Teacher>(`/teachers/${id}`, input);
      return data;
    },
    onSuccess: (teacher) => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success(t('toasts.updated', { name: teacher.fullName }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteTeacher() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teachers/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success(t('toasts.deleted', { name: t('nav.teachers') }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
