import { useQuery } from '@tanstack/react-query';
import type { WorkloadItemWithRelations } from '@/features/workload/api';
import { api } from '@/lib/api';

export interface MyWorkloadSummary {
  teacher: {
    id: string;
    fullName: string;
    position: string;
    degreeName: string;
    hasScientificDegree: boolean;
    /** Module JSON: "PhD" | "NoDegree" */
    degree: 'PhD' | 'NoDegree';
    annualNorm: number;
  };
  /** Alias of `items` (teacher_workload_module.md) */
  assignedWorkloads: WorkloadItemWithRelations[];
  totals: {
    totalHours: number;
    auditoriumHours: number;
    nonAuditoriumHours: number;
    items: number;
  };
  byTerm: { fall: number; spring: number; unknown: number };
  items: WorkloadItemWithRelations[];
}

export function useMyWorkload(academicYearId?: string) {
  return useQuery<MyWorkloadSummary>({
    queryKey: ['my-workload', academicYearId ?? null],
    queryFn: async () => {
      const { data } = await api.get<MyWorkloadSummary>('/my-workload', {
        params: academicYearId ? { academicYearId } : undefined,
      });
      return data;
    },
  });
}
