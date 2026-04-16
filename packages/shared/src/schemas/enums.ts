import { z } from 'zod';

export const UserRoleEnum = z.enum(['admin', 'teacher', 'student', 'guest']);
export const StudyLevelEnum = z.enum(['bachelor', 'master']);
export const StudyTypeEnum = z.enum(['full_time', 'part_time']);
export const AcademicTermEnum = z.enum(['fall', 'spring']);
export const LanguageEnum = z.enum(['uzbek', 'russian']);

export const WorkloadTypeEnum = z.enum([
  'lecture',
  'practice',
  'lab',
  'control',
  'course_project',
  'internship',
  'prediploma',
  'VQR',
  'MD',
  'NDP',
  'NS',
]);

export const WorkloadCategoryEnum = z.enum(['auditorium', 'non_auditorium']);
export const AssignmentStatusEnum = z.enum(['unassigned', 'assigned', 'invalid']);
export const StreamStatusEnum = z.enum(['draft', 'ready', 'assigned']);

export const CalculationModeEnum = z.enum([
  'coefficient_based',
  'fixed_per_student',
  'fixed_per_group',
  'fixed_value',
]);

export const FormulaScopeEnum = z.enum([
  'lecture',
  'control',
  'practice',
  'lab',
  'course_project',
  'VQR',
  'MD',
  'NDP',
  'NS',
]);

export const AssignmentActionEnum = z.enum(['assign', 'reassign', 'unassign']);
export const AuditActionEnum = z.enum(['create', 'update', 'delete']);

export const AuditEntityTypeEnum = z.enum([
  'teacher',
  'formula',
  'stream',
  'workload',
  'assignment',
  'user',
  'group',
  'direction',
  'subject_offering',
  'academic_year',
]);

export const ViewModeEnum = z.enum([
  'flat',
  'by_teacher',
  'by_semester',
  'by_category',
  'by_stream',
]);
