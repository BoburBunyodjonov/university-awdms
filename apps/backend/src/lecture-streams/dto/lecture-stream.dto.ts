import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  AssignStreamTeacherSchema,
  CreateLectureStreamSchema,
  LanguageEnum,
  StreamStatusEnum,
  UpdateLectureStreamSchema,
} from '@awdms/shared';

export class CreateLectureStreamDto extends createZodDto(
  CreateLectureStreamSchema,
) {}
export class UpdateLectureStreamDto extends createZodDto(
  UpdateLectureStreamSchema,
) {}
export class AssignStreamTeacherDto extends createZodDto(
  AssignStreamTeacherSchema,
) {}

export const LectureStreamQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  subjectOfferingId: z.string().uuid().optional(),
  language: LanguageEnum.optional(),
  status: StreamStatusEnum.optional(),
  teacherId: z.string().uuid().optional(),
  directionId: z.string().uuid().optional(),
});
export class LectureStreamQueryDto extends createZodDto(
  LectureStreamQuerySchema,
) {}
