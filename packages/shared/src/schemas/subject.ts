import { z } from 'zod';
import { AcademicTermEnum, StudyLevelEnum, StudyTypeEnum } from './enums';

// Subject catalog — one row per (direction, name) unique. Create can batch several directions.
export const CreateSubjectSchema = z.object({
  name: z.string().min(1).max(200),
  directionIds: z.array(z.string().uuid()).min(1).max(64),
  lectureCoefficient: z.number().min(0).default(0),
  controlCoefficient: z.number().min(0).default(0),
  practiceCoefficient: z.number().min(0).default(0),
  level: StudyLevelEnum,
  isActive: z.boolean().default(true),
});
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;

export const UpdateSubjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  lectureCoefficient: z.number().min(0).optional(),
  controlCoefficient: z.number().min(0).optional(),
  practiceCoefficient: z.number().min(0).optional(),
  directionId: z.string().uuid().optional(),
  level: StudyLevelEnum.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;

/** Full form values for subject edit (admin modal). */
export const EditSubjectFormSchema = z.object({
  name: z.string().min(1).max(200),
  lectureCoefficient: z.number().min(0).default(0),
  controlCoefficient: z.number().min(0).default(0),
  practiceCoefficient: z.number().min(0).default(0),
  directionId: z.string().uuid(),
  level: StudyLevelEnum,
  isActive: z.boolean(),
});
export type EditSubjectFormInput = z.infer<typeof EditSubjectFormSchema>;

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
