import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  CreateLectureStreamInput,
  Language,
  LectureStream,
  StreamStatus,
  UpdateLectureStreamInput,
} from '@awdms/shared';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { Paginated } from '@/features/teachers/api';

export interface StreamsQuery {
  page?: number;
  pageSize?: number;
  subjectOfferingId?: string;
  directionId?: string;
  language?: Language;
  status?: StreamStatus;
  teacherId?: string;
}

export interface StreamWithRelations extends LectureStream {
  subjectOffering: {
    id: string;
    academicTerm: 'fall' | 'spring';
    courseYear: number;
    semesterNumber: number;
    studyType: 'full_time' | 'part_time';
    subject: {
      id: string;
      name: string;
      code: string | null;
      level: 'bachelor' | 'master';
      lectureCoefficient: number;
      controlCoefficient: number;
      practiceCoefficient: number;
      directionId: string;
      direction: { id: string; name: string; code: string };
    };
  };
  teacher: {
    id: string;
    fullName: string;
    hasScientificDegree: boolean;
  } | null;
  groupLinks: Array<{
    streamId: string;
    groupId: string;
    subjectOfferingId: string;
    group: {
      id: string;
      name: string;
      language: Language;
      studentCount: number;
      courseYear: number;
    };
  }>;
  _count: { groupLinks: number; workloadItems: number };
}

const key = (q: StreamsQuery = {}) => ['lecture-streams', q] as const;

export function useStreams(query: StreamsQuery = {}) {
  return useQuery<Paginated<StreamWithRelations>>({
    queryKey: key(query),
    queryFn: async () => {
      const { data } = await api.get<Paginated<StreamWithRelations>>(
        '/streams',
        { params: query },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateStream() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLectureStreamInput) => {
      const { data } = await api.post<StreamWithRelations>('/streams', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lecture-streams'] });
      toast.success(t('toasts.stream_created'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateStream(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateLectureStreamInput) => {
      const { data } = await api.patch<StreamWithRelations>(
        `/streams/${id}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lecture-streams'] });
      toast.success(t('toasts.stream_updated'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useAssignStreamTeacher(id: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const { data } = await api.post<StreamWithRelations>(
        `/streams/${id}/assign-teacher`,
        { teacherId },
      );
      return data;
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['lecture-streams'] });
      toast.success(
        t('toasts.assigned', { name: s.teacher?.fullName ?? '' }),
      );
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteStream() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/streams/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lecture-streams'] });
      toast.success(t('toasts.deleted'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
