import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  CreateFormulaConfigInput,
  FormulaConfig,
  FormulaScope,
  StudyLevel,
  StudyType,
} from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { ListResponse } from '@/features/directions/api';

export interface FormulasQuery {
  scopeType?: FormulaScope;
  level?: StudyLevel;
  studyType?: StudyType;
  isActive?: boolean;
}

const key = (q: FormulasQuery = {}) => ['formulas', q] as const;

export function useFormulas(query: FormulasQuery = {}) {
  return useQuery<ListResponse<FormulaConfig>>({
    queryKey: key(query),
    queryFn: async () => {
      const { data } = await api.get<ListResponse<FormulaConfig>>('/formulas', {
        params: query,
      });
      return data;
    },
    staleTime: 600_000,
  });
}

export function useCreateFormula() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFormulaConfigInput) => {
      const { data } = await api.post<FormulaConfig>('/formulas', input);
      return data;
    },
    onSuccess: (f) => {
      qc.invalidateQueries({ queryKey: ['formulas'] });
      toast.success(t('toasts.created', { name: f.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateFormula(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateFormulaConfigInput>) => {
      const { data } = await api.patch<FormulaConfig>(`/formulas/${id}`, input);
      return data;
    },
    onSuccess: (f) => {
      qc.invalidateQueries({ queryKey: ['formulas'] });
      toast.success(t('toasts.updated', { name: f.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteFormula() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/formulas/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formulas'] });
      toast.success(t('toasts.deleted'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
