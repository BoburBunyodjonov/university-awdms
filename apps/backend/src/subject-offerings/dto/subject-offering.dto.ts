import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  AcademicTermEnum,
  CreateSubjectOfferingSchema,
  LinkGroupsSchema,
  StudyTypeEnum,
  UpdateSubjectOfferingSchema,
} from '@awdms/shared';

export class CreateSubjectOfferingDto extends createZodDto(
  CreateSubjectOfferingSchema,
) {}
export class UpdateSubjectOfferingDto extends createZodDto(
  UpdateSubjectOfferingSchema,
) {}
export class LinkGroupsDto extends createZodDto(LinkGroupsSchema) {}

export const SubjectOfferingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).optional(),
  subjectId: z.string().uuid().optional(),
  directionId: z.string().uuid().optional(),
  studyType: StudyTypeEnum.optional(),
  academicTerm: AcademicTermEnum.optional(),
  courseYear: z.coerce.number().int().min(1).max(6).optional(),
  isActive: z.coerce.boolean().optional(),
});
export class SubjectOfferingQueryDto extends createZodDto(
  SubjectOfferingQuerySchema,
) {}
