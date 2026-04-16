import { z } from 'zod';
import { LanguageEnum, StreamStatusEnum } from './enums';

// Rule 6 + 8: groups can be merged into one stream, but Uzbek/Russian cannot mix.
// The schema accepts a single `language`; the backend enforces that every linked
// group's language matches it.
export const CreateLectureStreamSchema = z.object({
  subjectOfferingId: z.string().uuid(),
  language: LanguageEnum,
  groupIds: z.array(z.string().uuid()).min(1),
  teacherId: z.string().uuid().nullable().optional(),
  status: StreamStatusEnum.default('draft'),
});
export type CreateLectureStreamInput = z.infer<
  typeof CreateLectureStreamSchema
>;

export const UpdateLectureStreamSchema = z
  .object({
    language: LanguageEnum.optional(),
    groupIds: z.array(z.string().uuid()).min(1).optional(),
    teacherId: z.string().uuid().nullable().optional(),
    status: StreamStatusEnum.optional(),
  })
  .strict();
export type UpdateLectureStreamInput = z.infer<
  typeof UpdateLectureStreamSchema
>;

export const AssignStreamTeacherSchema = z.object({
  teacherId: z.string().uuid(),
});
export type AssignStreamTeacherInput = z.infer<
  typeof AssignStreamTeacherSchema
>;
