import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateTeacherSchema, UpdateTeacherSchema } from '@awdms/shared';

export class CreateTeacherDto extends createZodDto(CreateTeacherSchema) {}
export class UpdateTeacherDto extends createZodDto(UpdateTeacherSchema) {}

export const TeacherQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).optional(),
  isActive: z.coerce.boolean().optional(),
  hasScientificDegree: z.coerce.boolean().optional(),
});
export class TeacherQueryDto extends createZodDto(TeacherQuerySchema) {}
