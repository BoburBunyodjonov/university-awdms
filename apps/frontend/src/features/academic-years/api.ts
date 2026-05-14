import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { AcademicYear, CreateAcademicYearInput } from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

const academicYearsKey = ['academic-years'] as const;

export function useAcademicYears() {
  return useQuery<AcademicYear[]>({
    queryKey: academicYearsKey,
    queryFn: async () => {
      const { data } = await api.get<AcademicYear[]>('/academic-years');
      return data;
    },
    staleTime: 600_000,
  });
}

export function useCreateAcademicYear() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAcademicYearInput) => {
      const { data } = await api.post<AcademicYear>('/academic-years', input);
      return data;
    },
    onSuccess: (y) => {
      qc.invalidateQueries({ queryKey: academicYearsKey });
      toast.success(t('toasts.created', { name: y.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateAcademicYear(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateAcademicYearInput>) => {
      const { data } = await api.patch<AcademicYear>(
        `/academic-years/${id}`,
        input,
      );
      return data;
    },
    onSuccess: (y) => {
      qc.invalidateQueries({ queryKey: academicYearsKey });
      toast.success(t('toasts.updated', { name: y.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteAcademicYear() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/academic-years/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academicYearsKey });
      toast.success(t('academicYears.deleted'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

/** Bitta yilni faol qiladi, qolganlarini `isActive: false` qiladi. */
export function useSetActiveAcademicYear() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const years =
        qc.getQueryData<AcademicYear[]>(academicYearsKey) ??
        (await qc.fetchQuery({
          queryKey: academicYearsKey,
          queryFn: async () => {
            const { data } = await api.get<AcademicYear[]>('/academic-years');
            return data;
          },
        })) ??
        [];
      for (const y of years) {
        if (y.id !== id && y.isActive) {
          await api.patch<AcademicYear>(`/academic-years/${y.id}`, {
            isActive: false,
          });
        }
      }
      const { data } = await api.patch<AcademicYear>(`/academic-years/${id}`, {
        isActive: true,
      });
      return data;
    },
    onSuccess: (y) => {
      qc.invalidateQueries({ queryKey: academicYearsKey });
      toast.success(t('academicYears.activated', { name: y.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
