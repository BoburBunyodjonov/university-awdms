import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TeacherLoad {
  id: string;
  fullName: string;
  hasScientificDegree: boolean;
  annualNorm: number;
  assignedHours: number;
  delta: number;
  utilisation: number;
}

export interface MonitoringSummary {
  academicYearId: string | null;
  totals: {
    totalHours: number;
    assignedHours: number;
    unassignedHours: number;
    totalDepartmentNorm: number;
    remainingNormHours: number;
    activeTeacherCount: number;
    auditoriumHours: number;
    nonAuditoriumHours: number;
    items: number;
    assigned: number;
    unassigned: number;
    invalid: number;
  };
  byCategory: { category: 'auditorium' | 'non_auditorium'; hours: number; count: number }[];
  byType: { type: string; hours: number; count: number }[];
  teachers: TeacherLoad[];
  overNorm: TeacherLoad[];
  underNorm: TeacherLoad[];
}

export interface RecentAssignmentRow {
  id: string;
  action: string;
  createdAt: string;
  workloadItemId: string;
  workloadType: string;
  plannedHours: number;
  subjectName: string | null;
  subjectCode: string | null;
  oldTeacherName: string | null;
  newTeacherName: string | null;
  performedByName: string;
}

export function useMonitoringSummary(academicYearId?: string) {
  return useQuery<MonitoringSummary>({
    enabled: Boolean(academicYearId),
    queryKey: ['monitoring-summary', academicYearId],
    queryFn: async () => {
      const { data } = await api.get<MonitoringSummary>(
        '/monitoring/summary',
        { params: { academicYearId } },
      );
      return data;
    },
    staleTime: 120_000,
  });
}

export function useRecentAssignments(
  academicYearId: string | undefined,
  limit = 15,
) {
  return useQuery<RecentAssignmentRow[]>({
    enabled: Boolean(academicYearId),
    queryKey: ['monitoring-recent', academicYearId, limit],
    queryFn: async () => {
      const { data } = await api.get<RecentAssignmentRow[]>(
        '/monitoring/recent-assignments',
        { params: { academicYearId, limit } },
      );
      return data;
    },
    staleTime: 60_000,
  });
}
