import type { WorkloadCategory, WorkloadType } from '../types/enums';

// Single source of truth for Rule 11 (course_project is auditorium) and the
// auditorium/non-auditorium split from §2.1. Imported by both backend services
// and frontend previews so the two can never drift.
export function categoryOf(type: WorkloadType): WorkloadCategory {
  switch (type) {
    case 'lecture':
    case 'practice':
    case 'lab':
    case 'control':
    case 'course_project':
      return 'auditorium';
    case 'internship':
    case 'prediploma':
    case 'VQR':
    case 'MD':
    case 'NDP':
    case 'NS':
      return 'non_auditorium';
  }
}

// Rule 13: MD, NDP, NS must go to teachers with a scientific degree.
// Per user policy (stricter than the baseline spec), lectures require a degreed
// teacher as well — this is enforced via assignedTeacher.hasScientificDegree at
// assignment time. Keep this helper as the single source of truth so Zod
// validation, generation, and the assign endpoint all agree.
export function requiresScientificDegree(type: WorkloadType): boolean {
  return (
    type === 'lecture' ||
    type === 'MD' ||
    type === 'NDP' ||
    type === 'NS'
  );
}
