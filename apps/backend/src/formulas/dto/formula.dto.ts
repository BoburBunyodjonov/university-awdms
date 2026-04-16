import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CreateFormulaConfigSchema,
  FormulaScopeEnum,
  PreviewFormulaSchema,
  StudyLevelEnum,
  StudyTypeEnum,
  UpdateFormulaConfigSchema,
} from '@awdms/shared';

export class CreateFormulaDto extends createZodDto(CreateFormulaConfigSchema) {}
export class UpdateFormulaDto extends createZodDto(UpdateFormulaConfigSchema) {}
export class PreviewFormulaDto extends createZodDto(PreviewFormulaSchema) {}

export const FormulaQuerySchema = z.object({
  scopeType: FormulaScopeEnum.optional(),
  level: StudyLevelEnum.optional(),
  studyType: StudyTypeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
});
export class FormulaQueryDto extends createZodDto(FormulaQuerySchema) {}
