// String-literal unions — values MUST match Prisma enums in
// apps/backend/prisma/schema.prisma character-for-character.

export type UserRole = 'admin' | 'teacher' | 'student' | 'guest';

export type StudyLevel = 'bachelor' | 'master';

export type StudyType = 'full_time' | 'part_time';

export type AcademicTerm = 'fall' | 'spring';

export type Language = 'uzbek' | 'russian';

export type WorkloadType =
  | 'lecture'
  | 'practice'
  | 'lab'
  | 'control'
  | 'course_project'
  | 'internship'
  | 'prediploma'
  | 'VQR'
  | 'MD'
  | 'NDP'
  | 'NS';

export type WorkloadCategory = 'auditorium' | 'non_auditorium';

export type AssignmentStatus = 'unassigned' | 'assigned' | 'invalid';

export type StreamStatus = 'draft' | 'ready' | 'assigned';

export type CalculationMode =
  | 'coefficient_based'
  | 'fixed_per_student'
  | 'fixed_per_group'
  | 'fixed_value';

export type FormulaScope =
  | 'lecture'
  | 'control'
  | 'practice'
  | 'lab'
  | 'course_project'
  | 'VQR'
  | 'MD'
  | 'NDP'
  | 'NS';

export type AssignmentAction = 'assign' | 'reassign' | 'unassign';

export type AuditAction = 'create' | 'update' | 'delete';

export type AuditEntityType =
  | 'teacher'
  | 'formula'
  | 'stream'
  | 'workload'
  | 'assignment'
  | 'user'
  | 'group'
  | 'direction'
  | 'subject_offering'
  | 'academic_year';

// Section 9.6 view modes for workload tables
export type ViewMode =
  | 'flat'
  | 'by_teacher'
  | 'by_semester'
  | 'by_category'
  | 'by_stream';
