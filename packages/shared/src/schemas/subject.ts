import { z } from 'zod';
import { AcademicTermEnum, StudyLevelEnum, StudyTypeEnum } from './enums';

// Subject catalog — a Subject belongs to a Direction.
export const CreateSubjectSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().trim().max(50).nullable().optional(),
  directionId: z.string().uuid(),
  level: StudyLevelEnum,
  isActive: z.boolean().default(true),
});
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;

export const UpdateSubjectSchema = CreateSubjectSchema.partial();
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;

// Offering = one (subject, term, course, studyType, semester) combo + group links.
export const CreateSubjectOfferingSchema = z.object({
  subjectId: z.string().uuid(),
  studyType: StudyTypeEnum,
  courseYear: z.number().int().min(1).max(6),
  semesterNumber: z.number().int().min(1).max(12),
  academicTerm: AcademicTermEnum,
  isActive: z.boolean().default(true),
  groupIds: z.array(z.string().uuid()).default([]),
});
export type CreateSubjectOfferingInput = z.infer<
  typeof CreateSubjectOfferingSchema
>;

export const UpdateSubjectOfferingSchema =
  CreateSubjectOfferingSchema.partial();
export type UpdateSubjectOfferingInput = z.infer<
  typeof UpdateSubjectOfferingSchema
>;

// Explicit "link groups" endpoint body.
export const LinkGroupsSchema = z.object({
  groupIds: z.array(z.string().uuid()).min(1),
});
export type LinkGroupsInput = z.infer<typeof LinkGroupsSchema>;
