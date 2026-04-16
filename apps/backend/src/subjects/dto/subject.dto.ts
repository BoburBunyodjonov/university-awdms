import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CreateSubjectSchema,
  StudyLevelEnum,
  UpdateSubjectSchema,
} from '@awdms/shared';

export class CreateSubjectDto extends createZodDto(CreateSubjectSchema) {}
export class UpdateSubjectDto extends createZodDto(UpdateSubjectSchema) {}

export const SubjectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).optional(),
  directionId: z.string().uuid().optional(),
  level: StudyLevelEnum.optional(),
  isActive: z.coerce.boolean().optional(),
});
export class SubjectQueryDto extends createZodDto(SubjectQuerySchema) {}
