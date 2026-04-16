import { z } from 'zod';
import {
  CalculationModeEnum,
  FormulaScopeEnum,
  StudyLevelEnum,
  StudyTypeEnum,
} from './enums';

// Rule 14: only admin may edit. Enforced at API guard level.
// Schema-level rule: the required numeric field must be populated
// for the given calculationMode.
export const CreateFormulaConfigSchema = z
  .object({
    name: z.string().min(1).max(200),
    scopeType: FormulaScopeEnum,
    level: StudyLevelEnum,
    studyType: StudyTypeEnum,
    calculationMode: CalculationModeEnum,
    baseHours: z.number().nonnegative().default(0),
    coefficientPerStudent: z.number().nonnegative().default(0),
    fixedHoursPerStudent: z.number().nonnegative().default(0),
    fixedHoursPerGroup: z.number().nonnegative().default(0),
    fixedValue: z.number().nonnegative().default(0),
    isActive: z.boolean().default(true),
    effectiveFrom: z.string().datetime().or(z.string().date()),
  })
  .superRefine((v, ctx) => {
    const addErr = (field: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [field], message });

    switch (v.calculationMode) {
      case 'coefficient_based':
        if (v.coefficientPerStudent <= 0)
          addErr(
            'coefficientPerStudent',
            'Must be > 0 for coefficient_based mode',
          );
        break;
      case 'fixed_per_student':
        if (v.fixedHoursPerStudent <= 0)
          addErr(
            'fixedHoursPerStudent',
            'Must be > 0 for fixed_per_student mode',
          );
        break;
      case 'fixed_per_group':
        if (v.fixedHoursPerGroup <= 0)
          addErr(
            'fixedHoursPerGroup',
            'Must be > 0 for fixed_per_group mode',
          );
        break;
      case 'fixed_value':
        if (v.fixedValue <= 0)
          addErr('fixedValue', 'Must be > 0 for fixed_value mode');
        break;
    }
  });
export type CreateFormulaConfigInput = z.infer<
  typeof CreateFormulaConfigSchema
>;

export const UpdateFormulaConfigSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    scopeType: FormulaScopeEnum.optional(),
    level: StudyLevelEnum.optional(),
    studyType: StudyTypeEnum.optional(),
    calculationMode: CalculationModeEnum.optional(),
    baseHours: z.number().nonnegative().optional(),
    coefficientPerStudent: z.number().nonnegative().optional(),
    fixedHoursPerStudent: z.number().nonnegative().optional(),
    fixedHoursPerGroup: z.number().nonnegative().optional(),
    fixedValue: z.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
    effectiveFrom: z.string().datetime().or(z.string().date()).optional(),
  })
  .strict();
export type UpdateFormulaConfigInput = z.infer<
  typeof UpdateFormulaConfigSchema
>;

// Preview endpoint input (POST /api/formulas/:id/preview)
export const PreviewFormulaSchema = z.object({
  studentCount: z.number().int().min(0),
  groupCount: z.number().int().min(0).default(1),
});
export type PreviewFormulaInput = z.infer<typeof PreviewFormulaSchema>;
