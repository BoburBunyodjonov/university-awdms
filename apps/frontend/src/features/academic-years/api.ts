import { useQuery } from '@tanstack/react-query';
import type { AcademicYear } from '@awdms/shared';
import { api } from '@/lib/api';

export function useAcademicYears() {
  return useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await api.get<AcademicYear[]>('/academic-years');
      return data;
    },
  });
}
