import { z } from 'zod';

export const CreateTeacherSchema = z.object({
  fullName: z.string().min(2).max(200),
  degreeName: z.string().min(1).max(200),
  hasScientificDegree: z.boolean(),
  position: z.string().min(1).max(200),
  annualNorm: z.number().int().min(0).max(2000),
  isActive: z.boolean().default(true),
});
export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>;

export const UpdateTeacherSchema = CreateTeacherSchema.partial();
export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>;
