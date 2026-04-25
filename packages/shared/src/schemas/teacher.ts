import { z } from 'zod';

export const ScientificDegreeNameEnum = z.enum([
  "Ilmiy daraja yo'q",
  'PhD',
  'DSc',
]);
export type ScientificDegreeName = z.infer<typeof ScientificDegreeNameEnum>;

export const CreateTeacherSchema = z.object({
  fullName: z.string().min(2).max(200),
  degreeName: ScientificDegreeNameEnum,
  hasScientificDegree: z.boolean().optional(),
  position: z.string().min(1).max(200),
  annualNorm: z.number().int().min(0).max(2000),
  isActive: z.boolean().default(true),
});
export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>;

export const UpdateTeacherSchema = CreateTeacherSchema.partial();
export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>;
