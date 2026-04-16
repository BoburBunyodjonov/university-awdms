import { z } from 'zod';
import {
  AssignmentStatusEnum,
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
    studentCount: z.number().int().min(0).default(0),
    plannedHours: z.number().nonnegative().default(0),
    formulaConfigId: z.string().uuid().nullable().optional(),
    requiresDegree: z.boolean().optional(),
    assignedTeacherId: z.string().uuid().nullable().optional(),
    status: AssignmentStatusEnum.default('unassigned'),
  })
  .superRefine((v, ctx) => {
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
