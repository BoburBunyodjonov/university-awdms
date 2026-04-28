import type {
  AcademicTerm,
  AssignmentAction,
  AssignmentStatus,
  AuditAction,
  AuditEntityType,
  CalculationMode,
  FormulaScope,
  Language,
  StreamStatus,
  StudyLevel,
  StudyType,
  UserRole,
  WorkloadCategory,
  WorkloadType,
} from './enums';

// API wire format — dates are ISO 8601 strings.
export type IsoDateTime = string;
export type IsoDate = string;

// Section 7.1
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  teacherId: string | null;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

// Section 7.2
export interface Teacher {
  id: string;
  fullName: string;
  degreeName: string;
  hasScientificDegree: boolean;
  position: string;
  annualNorm: number;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  /** On list API: sum of `plannedHours` for assigned items, split by category (all academic years). */
  auditoriumHours?: number;
  nonAuditoriumHours?: number;
}

// Section 7.3
export interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
  startDate: IsoDate;
  endDate: IsoDate;
}

// Section 7.4
export interface Direction {
  id: string;
  name: string;
  code: string;
  level: StudyLevel;
}

// Section 7.5
export interface Group {
  id: string;
  name: string;
  directionId: string;
  level: StudyLevel;
  studyType: StudyType;
  courseYear: number;
  semesterNumber: number;
  academicTerm: AcademicTerm;
  language: Language;
  studentCount: number;
}

// Subject catalog
export interface Subject {
  id: string;
  name: string;
  code: string | null;
  lectureCoefficient: number;
  controlCoefficient: number;
  practiceCoefficient: number;
  directionId: string;
  level: StudyLevel;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

// Section 7.6 — one offering per (subject, term, course, study-type, semester).
export interface SubjectOffering {
  id: string;
  subjectId: string;
  studyType: StudyType;
  courseYear: number;
  semesterNumber: number;
  academicTerm: AcademicTerm;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

// Section 7.7
export interface FormulaConfig {
  id: string;
  name: string;
  scopeType: FormulaScope;
  level: StudyLevel;
  studyType: StudyType;
  calculationMode: CalculationMode;
  baseHours: number;
  coefficientPerStudent: number;
  fixedHoursPerStudent: number;
  fixedHoursPerGroup: number;
  fixedValue: number;
  isActive: boolean;
  effectiveFrom: IsoDate;
}

// Section 7.8
export interface LectureStream {
  id: string;
  name: string;
  subjectOfferingId: string;
  language: Language;
  totalStudentCount: number;
  lectureHours: number;
  controlHours: number;
  teacherId: string | null;
  status: StreamStatus;
}

// Section 7.9
export interface WorkloadItem {
  id: string;
  academicYearId: string;
  subjectOfferingId: string | null;
  lectureStreamId: string | null;
  groupId: string | null;
  workloadType: WorkloadType;
  category: WorkloadCategory;
  academicTerm: AcademicTerm | null;
  semesterNumber: number | null;
  courseYear: number | null;
  level: StudyLevel | null;
  studyType: StudyType | null;
  studentCount: number;
  plannedHours: number;
  formulaConfigId: string | null;
  requiresDegree: boolean;
  assignedTeacherId: string | null;
  status: AssignmentStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

// Section 7.10
export interface AssignmentLog {
  id: string;
  workloadItemId: string;
  oldTeacherId: string | null;
  newTeacherId: string | null;
  action: AssignmentAction;
  performedByUserId: string;
  createdAt: IsoDateTime;
}

// Section 7.11
export interface AuditLog {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  oldValue: unknown | null;
  newValue: unknown | null;
  performedByUserId: string;
  createdAt: IsoDateTime;
}

// Aggregate view returned by GET /api/teachers/:id/workload (Section 8.2 / 4.10)
export interface TeacherWorkloadSummary {
  teacherId: string;
  academicYearId: string;
  annualNorm: number;
  totalPlannedHours: number;
  auditoriumHours: number;
  nonAuditoriumHours: number;
  bySemester: Record<AcademicTerm, number>;
}
