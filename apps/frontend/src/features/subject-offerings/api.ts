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
  CreateSubjectOfferingInput,
  Language,
  StudyLevel,
  StudyType,
  SubjectOffering,
  UpdateSubjectOfferingInput,
} from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { Paginated } from '@/features/teachers/api';

export interface SubjectOfferingsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  subjectId?: string;
  directionId?: string;
  studyType?: StudyType;
  academicTerm?: AcademicTerm;
  courseYear?: number;
  isActive?: boolean;
}

export interface OfferingWithRelations extends SubjectOffering {
  subject: {
    id: string;
    name: string;
    code: string | null;
    level: StudyLevel;
    lectureCoefficient: number;
    controlCoefficient: number;
    practiceCoefficient: number;
    directionId: string;
    direction: { id: string; name: string; code: string };
  };
  groupLinks: Array<{
    subjectOfferingId: string;
    groupId: string;
    subjectOfferingId_legacy?: never;
    group: {
      id: string;
      name: string;
      language: Language;
      studentCount: number;
      courseYear: number;
    };
  }>;
  _count: { groupLinks: number; lectureStreams: number };
}

const key = (q: SubjectOfferingsQuery = {}) =>
  ['subject-offerings', q] as const;

export function useSubjectOfferings(query: SubjectOfferingsQuery = {}) {
  return useQuery<Paginated<OfferingWithRelations>>({
    queryKey: key(query),
    queryFn: async () => {
      const { data } = await api.get<Paginated<OfferingWithRelations>>(
        '/subject-offerings',
        { params: query },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateSubjectOffering() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSubjectOfferingInput) => {
      const { data } = await api.post<OfferingWithRelations>(
        '/subject-offerings',
        input,
      );
      return data;
    },
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ['subject-offerings'] });
      toast.success(t('toasts.created', { name: o.subject.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateSubjectOffering(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSubjectOfferingInput) => {
      const { data } = await api.patch<OfferingWithRelations>(
        `/subject-offerings/${id}`,
        input,
      );
      return data;
    },
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ['subject-offerings'] });
      toast.success(t('toasts.updated', { name: o.subject.name }));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteSubjectOffering() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subject-offerings/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subject-offerings'] });
      toast.success(t('toasts.deleted'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
