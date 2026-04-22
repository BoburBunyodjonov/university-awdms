export type Degree = 'PhD' | 'NoDegree';

export type SemesterFilter = 'all' | 'fall' | 'spring';

/** Top-level workload kinds for the assignment modal */
export type WorkloadKind =
  | 'lecture'
  | 'practice'
  | 'control'
  | 'individual_project'
  | 'vqr_day'
  | 'vqr_parttime'
  | 'internship'
  | 'prediploma'
  | 'scientific_pedagogical'
  | 'scientific_internship'
  | 'phd_supervision_parttime'
  | 'phd_supervision_fulltime';

export type WorkloadCategory = 'auditorium' | 'non_auditorium';

export interface Teacher {
  id: string;
  name: string;
  degree: Degree;
  annualNorm: number;
  position: string;
  departmentId: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Group {
  id: string;
  name: string;
  language: 'uz' | 'ru';
  studentCount: number;
}

export interface Stream {
  id: string;
  name: string;
  subjectId: string;
  studentCount: number;
}

/** Row shown on teacher profile & used in validation */
export interface WorkloadAssignment {
  id: string;
  teacherId: string;
  kind: WorkloadKind;
  category: WorkloadCategory;
  semester: 'fall' | 'spring';
  subjectId: string;
  subjectName: string;
  /** group id, stream id, or label for non-group items */
  groupOrStreamLabel: string;
  students: number;
  coefficient: number;
  hours: number;
  /** auditorium vs non — for summary split */
  isAuditorium: boolean;
  /** Optional: for duplicate / “split” validation in the mock UI */
  groupIds?: string[];
}

export interface DepartmentStats {
  totalDepartmentHours: number;
  assignedHours: number;
  remainingHours: number;
  teacherCount: number;
  unassignedWorkloadCount: number;
}

export interface MockStore {
  teachers: Teacher[];
  subjects: Subject[];
  groups: Group[];
  streams: Stream[];
  assignments: WorkloadAssignment[];
  department: DepartmentStats;
}

export const KIND_LABEL: Record<WorkloadKind, string> = {
  lecture: 'Lecture',
  practice: 'Practice',
  control: 'Control',
  individual_project: 'Individual project',
  vqr_day: 'VQR (Day)',
  vqr_parttime: 'VQR (Part-time)',
  internship: 'Internship',
  prediploma: 'Pre-diploma',
  scientific_pedagogical: 'Scientific pedagogical work',
  scientific_internship: 'Scientific internship',
  phd_supervision_parttime: 'PhD supervision (Part-time)',
  phd_supervision_fulltime: 'PhD supervision (Full-time)',
};

export const KIND_CATEGORY: Record<WorkloadKind, WorkloadCategory> = {
  lecture: 'auditorium',
  practice: 'auditorium',
  control: 'auditorium',
  individual_project: 'auditorium',
  vqr_day: 'non_auditorium',
  vqr_parttime: 'non_auditorium',
  internship: 'non_auditorium',
  prediploma: 'non_auditorium',
  scientific_pedagogical: 'non_auditorium',
  scientific_internship: 'non_auditorium',
  phd_supervision_parttime: 'non_auditorium',
  phd_supervision_fulltime: 'non_auditorium',
};

const PHD_ONLY: WorkloadKind[] = [
  'scientific_pedagogical',
  'scientific_internship',
  'phd_supervision_parttime',
  'phd_supervision_fulltime',
];

export function isPhdOnlyKind(kind: WorkloadKind): boolean {
  return PHD_ONLY.includes(kind);
}

export function isMax3StudentsKind(kind: WorkloadKind): boolean {
  return PHD_ONLY.includes(kind);
}
