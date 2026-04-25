import type { AcademicTerm, AssignmentStatus, WorkloadType } from '@awdms/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Soddalashtirilgan yuklama qatori (GET /api/teacher/profile) */
export interface TeacherAssignedWorkloadRow {
  id: string;
  workloadType: WorkloadType;
  plannedHours: number;
  status: AssignmentStatus;
  subjectCode: string | null;
  subjectName: string | null;
  academicTerm: AcademicTerm | null;
  courseYear: number | null;
  semesterNumber: number | null;
}

/** GET /api/teacher/profile */
export interface TeacherModuleProfile {
  fullName: string;
  degree: 'PhD' | 'DSc' | 'NoDegree';
  annualNorm: number;
  position: string;
  degreeName: string;
  hasScientificDegree: boolean;
  isActive: boolean;
  assignedWorkloads: TeacherAssignedWorkloadRow[];
  workloadItemsCount: number;
}

export function useTeacherProfile() {
  return useQuery<TeacherModuleProfile>({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const { data } = await api.get<TeacherModuleProfile>('/teacher/profile');
      return data;
    },
  });
}
