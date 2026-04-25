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
    case 'individual_project':
    case 'course_project':
      return 'auditorium';
    case 'internship':
    case 'prediploma':
    case 'VQR':
    case 'VQR_full_time':
    case 'VQR_part_time':
    case 'MD':
    case 'NDP':
    case 'NS':
    case 'phd_supervision_fulltime':
    case 'phd_supervision_parttime':
    case 'scientific_pedagogical':
    case 'scientific_internship':
    case 'master_dissertation_supervision':
      return 'non_auditorium';
  }
}

// Rule 13: MD, NDP, NS must go to teachers with a scientific degree; module spec
// PhD-only scientific work types as well. Lectures: stricter user policy in assign.
/** Ma'ruza va amaliyot yuklamasi bo'linib ko'rinmasligi kerak (bitta qator). */
export function isIndivisibleAuditoriumWorkload(
  type: WorkloadType,
): boolean {
  return type === 'lecture' || type === 'practice';
}

export function requiresScientificDegree(type: WorkloadType): boolean {
  return (
    type === 'MD' ||
    type === 'NDP' ||
    type === 'NS' ||
    type === 'phd_supervision_fulltime' ||
    type === 'phd_supervision_parttime' ||
    type === 'scientific_pedagogical' ||
    type === 'scientific_internship' ||
    type === 'master_dissertation_supervision'
  );
}
