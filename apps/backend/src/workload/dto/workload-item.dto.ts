import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  AcademicTermEnum,
  AssignmentStatusEnum,
  LanguageEnum,
  AssignWorkloadBySpecSchema,
  AssignWorkloadSchema,
  CreateWorkloadItemSchema,
  GenerateWorkloadSchema,
  ReassignWorkloadSchema,
  UnassignWorkloadSchema,
  WorkloadCategoryEnum,
  WorkloadTypeEnum,
} from '@awdms/shared';

export class CreateWorkloadItemDto extends createZodDto(
  CreateWorkloadItemSchema,
) {}

export const UpdateWorkloadItemSchema = z
  .object({
    studentCount: z.number().int().min(0).optional(),
    plannedHours: z.number().nonnegative().optional(),
    formulaConfigId: z.string().uuid().nullable().optional(),
    requiresDegree: z.boolean().optional(),
    status: AssignmentStatusEnum.optional(),
  })
  .strict();
export class UpdateWorkloadItemDto extends createZodDto(
  UpdateWorkloadItemSchema,
) {}

export class GenerateWorkloadDto extends createZodDto(
  GenerateWorkloadSchema,
) {}
export class AssignWorkloadDto extends createZodDto(AssignWorkloadSchema) {}
export class AssignWorkloadBySpecDto extends createZodDto(
  AssignWorkloadBySpecSchema,
) {}
export class ReassignWorkloadDto extends createZodDto(ReassignWorkloadSchema) {}
export class UnassignWorkloadDto extends createZodDto(UnassignWorkloadSchema) {}

export const WorkloadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  academicYearId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  subjectOfferingId: z.string().uuid().optional(),
  lectureStreamId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  assignedTeacherId: z.string().uuid().optional(),
  academicTerm: AcademicTermEnum.optional(),
  language: LanguageEnum.optional(),
  workloadType: WorkloadTypeEnum.optional(),
  includeControlWithLecture: z.coerce.boolean().optional(),
  category: WorkloadCategoryEnum.optional(),
  status: AssignmentStatusEnum.optional(),
  unassignedOnly: z.coerce.boolean().optional(),
});
export class WorkloadQueryDto extends createZodDto(WorkloadQuerySchema) {}
