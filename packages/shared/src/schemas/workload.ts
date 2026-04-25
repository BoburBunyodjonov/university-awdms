import { z } from 'zod';
import {
  AcademicTermEnum,
  AssignmentStatusEnum,
  StudyLevelEnum,
  StudyTypeEnum,
  WorkloadCategoryEnum,
  WorkloadTypeEnum,
} from './enums';
import { categoryOf, requiresScientificDegree } from '../lib/category';

// Rule 10: practical items must reference a lectureStreamId.
// Rule 12: VQR/MD/NDP/NS tracked by studentCount only.
// category & requiresDegree can be derived from workloadType, but are accepted
// (and validated) on input so the frontend preview and backend persist
// identical snapshots.
export const CreateWorkloadItemSchema = z
  .object({
    academicYearId: z.string().uuid(),
    subjectOfferingId: z.string().uuid().nullable().optional(),
    lectureStreamId: z.string().uuid().nullable().optional(),
    groupId: z.string().uuid().nullable().optional(),
    workloadType: WorkloadTypeEnum,
    category: WorkloadCategoryEnum.optional(),
    academicTerm: AcademicTermEnum.nullable().optional(),
    semesterNumber: z.number().int().min(1).max(12).nullable().optional(),
    courseYear: z.number().int().min(1).max(6).nullable().optional(),
    level: StudyLevelEnum.nullable().optional(),
    studyType: StudyTypeEnum.nullable().optional(),
    studentCount: z.number().int().min(0).default(0),
    plannedHours: z.number().nonnegative().default(0),
    formulaConfigId: z.string().uuid().nullable().optional(),
    requiresDegree: z.boolean().optional(),
    assignedTeacherId: z.string().uuid().nullable().optional(),
    status: AssignmentStatusEnum.default('unassigned'),
  })
  .superRefine((v, ctx) => {
    if (v.workloadType === 'VQR') {
      ctx.addIssue({
        code: 'custom',
        path: ['workloadType'],
        message:
          'Legacy "VQR" is not valid for new items. Use VQR_full_time (day) or VQR_part_time (external).',
      });
    }
    if (v.workloadType === 'practice' && !v.lectureStreamId) {
      ctx.addIssue({
        code: 'custom',
        path: ['lectureStreamId'],
        message: 'practice items must be linked to a lecture stream (Rule 10)',
      });
    }
    const expectedCategory = categoryOf(v.workloadType);
    if (v.category && v.category !== expectedCategory) {
      ctx.addIssue({
        code: 'custom',
        path: ['category'],
        message: `workloadType "${v.workloadType}" requires category "${expectedCategory}"`,
      });
    }
    const expectedDegree = requiresScientificDegree(v.workloadType);
    if (v.requiresDegree !== undefined && v.requiresDegree !== expectedDegree) {
      ctx.addIssue({
        code: 'custom',
        path: ['requiresDegree'],
        message: `workloadType "${v.workloadType}" requiresDegree must be ${expectedDegree} (Rule 13)`,
      });
    }
    if (
      (v.workloadType === 'MD' ||
        v.workloadType === 'NDP' ||
        v.workloadType === 'NS' ||
        v.workloadType === 'phd_supervision_fulltime' ||
        v.workloadType === 'phd_supervision_parttime' ||
        v.workloadType === 'scientific_pedagogical' ||
        v.workloadType === 'scientific_internship' ||
        v.workloadType === 'master_dissertation_supervision') &&
      v.studentCount > 3
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['studentCount'],
        message: `workloadType "${v.workloadType}" allows at most 3 students per item`,
      });
    }
  });
export type CreateWorkloadItemInput = z.infer<typeof CreateWorkloadItemSchema>;

export const GenerateWorkloadSchema = z.object({
  academicYearId: z.string().uuid(),
  subjectOfferingIds: z.array(z.string().uuid()).optional(),
});
export type GenerateWorkloadInput = z.infer<typeof GenerateWorkloadSchema>;

export const AssignWorkloadSchema = z.object({
  teacherId: z.string().uuid(),
});
export type AssignWorkloadInput = z.infer<typeof AssignWorkloadSchema>;

/** POST /workload/assign (module spec) — same semantics as POST /workload/:id/assign */
export const AssignWorkloadBySpecSchema = z
  .object({
    workloadItemId: z.string().uuid(),
    teacherId: z.string().uuid(),
  })
  .strict();
export type AssignWorkloadBySpecInput = z.infer<typeof AssignWorkloadBySpecSchema>;

export const ReassignWorkloadSchema = z.object({
  teacherId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});
export type ReassignWorkloadInput = z.infer<typeof ReassignWorkloadSchema>;

export const UnassignWorkloadSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .strict();
export type UnassignWorkloadInput = z.infer<typeof UnassignWorkloadSchema>;
