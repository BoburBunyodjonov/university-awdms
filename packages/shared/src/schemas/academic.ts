import { z } from 'zod';
import {
  AcademicTermEnum,
  LanguageEnum,
  StudyLevelEnum,
  StudyTypeEnum,
} from './enums';

export const CreateAcademicYearSchema = z
  .object({
    name: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'Use YYYY-YYYY format (e.g. 2026-2027)'),
    isActive: z.boolean().default(false),
    startDate: z.string().datetime().or(z.string().date()),
    endDate: z.string().datetime().or(z.string().date()),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });
export type CreateAcademicYearInput = z.infer<typeof CreateAcademicYearSchema>;

export const CreateDirectionSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  level: StudyLevelEnum,
});
export type CreateDirectionInput = z.infer<typeof CreateDirectionSchema>;

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(50),
  directionId: z.string().uuid(),
  level: StudyLevelEnum,
  studyType: StudyTypeEnum,
  courseYear: z.number().int().min(1).max(6),
  semesterNumber: z.number().int().min(1).max(12),
  academicTerm: AcademicTermEnum,
  language: LanguageEnum,
  studentCount: z.number().int().min(1).max(1000),
});
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;

export const UpdateGroupSchema = CreateGroupSchema.partial();
export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>;
