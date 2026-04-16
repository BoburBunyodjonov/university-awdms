import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  AcademicTermEnum,
  CreateGroupSchema,
  LanguageEnum,
  StudyLevelEnum,
  UpdateGroupSchema,
} from '@awdms/shared';

export class CreateGroupDto extends createZodDto(CreateGroupSchema) {}
export class UpdateGroupDto extends createZodDto(UpdateGroupSchema) {}

export const GroupQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).optional(),
  directionId: z.string().uuid().optional(),
  language: LanguageEnum.optional(),
  level: StudyLevelEnum.optional(),
  academicTerm: AcademicTermEnum.optional(),
  courseYear: z.coerce.number().int().min(1).max(6).optional(),
});
export class GroupQueryDto extends createZodDto(GroupQuerySchema) {}
