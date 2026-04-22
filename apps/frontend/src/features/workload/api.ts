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
  AssignmentStatus,
  CreateWorkloadItemInput,
  GenerateWorkloadInput,
  Language,
  StudyLevel,
  StudyType,
  WorkloadCategory,
  WorkloadItem,
  WorkloadType,
} from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { Paginated } from '@/features/teachers/api';

export interface WorkloadQuery {
  page?: number;
  pageSize?: number;
  academicYearId?: string;
  subjectOfferingId?: string;
  lectureStreamId?: string;
  groupId?: string;
  assignedTeacherId?: string;
  /** Fall/spring — `subject_offering` bo‘yicha */
  academicTerm?: AcademicTerm;
  workloadType?: WorkloadType;
  category?: WorkloadCategory;
  status?: AssignmentStatus;
  unassignedOnly?: boolean;
}

export interface WorkloadItemWithRelations extends WorkloadItem {
  academicYear: { id: string; name: string; isActive: boolean };
  subjectOffering: {
    id: string;
    academicTerm: 'fall' | 'spring';
    courseYear: number;
    semesterNumber: number;
    studyType: StudyType;
    subject: {
      id: string;
      name: string;
      code: string | null;
      level: StudyLevel;
      direction: { id: string; name: string; code: string };
    };
  } | null;
  lectureStream: {
    id: string;
    language: Language;
    totalStudentCount: number;
    status: 'draft' | 'ready' | 'assigned';
  } | null;
  group: {
    id: string;
    name: string;
    language: Language;
    studentCount: number;
  } | null;
  assignedTeacher: {
    id: string;
    fullName: string;
    hasScientificDegree: boolean;
    position: string;
    annualNorm: number;
  } | null;
  formulaConfig: {
    id: string;
    name: string;
    calculationMode: string;
    scopeType: string;
    baseHours: number;
    coefficientPerStudent: number;
    fixedHoursPerStudent: number;
    fixedHoursPerGroup: number;
    fixedValue: number;
  } | null;
}

const key = (q: WorkloadQuery = {}) => ['workload', q] as const;

export function useWorkloadItems(query: WorkloadQuery = {}) {
  const hasFilters =
    Boolean(query.academicYearId) ||
    Boolean(query.subjectOfferingId) ||
    Boolean(query.assignedTeacherId) ||
    Boolean(query.academicTerm) ||
    Boolean(query.workloadType) ||
    Boolean(query.status);
  return useQuery<Paginated<WorkloadItemWithRelations>>({
    queryKey: key(query),
    queryFn: async () => {
      const { data } = await api.get<Paginated<WorkloadItemWithRelations>>(
        '/workload',
        { params: query },
      );
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: hasFilters ? 60_000 : 30_000,
  });
}

export function useGenerateWorkload() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GenerateWorkloadInput) => {
      const { data } = await api.post<{
        createdCount: number;
        skippedCount: number;
        createdIds: string[];
      }>('/workload/generate', input);
      return data;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['workload'] });
      toast.success(
        t('toasts.generated', {
          created: res.createdCount,
          skipped: res.skippedCount,
        }),
      );
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

/**
 * Create a workload item, optionally assigning a teacher in the same flow.
 * When `input.assignedTeacherId` is provided the create is immediately
 * followed by POST /workload/:id/assign so Rule 1 / Rule 13 validation runs
 * on the backend and the assignment_log is populated correctly.
 */
export function useCreateWorkload() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWorkloadItemInput) => {
      const { assignedTeacherId, status: _status, ...rest } = input;
      const { data: created } = await api.post<WorkloadItemWithRelations>(
        '/workload',
        rest,
      );
      if (!assignedTeacherId) return created;
      const { data: assigned } = await api.post<WorkloadItemWithRelations>(
        `/workload/${created.id}/assign`,
        { teacherId: assignedTeacherId },
      );
      return assigned;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['workload'] });
      qc.invalidateQueries({ queryKey: ['teachers'] });
      qc.invalidateQueries({ queryKey: ['teacher-workload'] });
      toast.success(
        t('toasts.assigned', {
          name: item.assignedTeacher?.fullName ?? '',
        }),
      );
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useAssignWorkload() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; teacherId: string }) => {
      const { data } = await api.post<WorkloadItemWithRelations>(
        `/workload/${args.id}/assign`,
        { teacherId: args.teacherId },
      );
      return data;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['workload'] });
      toast.success(
        t('toasts.assigned', {
          name: item.assignedTeacher?.fullName ?? '',
        }),
      );
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUnassignWorkload() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<WorkloadItemWithRelations>(
        `/workload/${id}/unassign`,
        {},
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workload'] });
      toast.success(t('toasts.unassigned'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteWorkload() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workload/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workload'] });
      toast.success(t('toasts.deleted'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
