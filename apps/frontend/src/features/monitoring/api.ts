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
  });
}
