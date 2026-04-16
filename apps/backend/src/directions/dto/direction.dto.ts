import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateDirectionSchema, StudyLevelEnum } from '@awdms/shared';

export class CreateDirectionDto extends createZodDto(CreateDirectionSchema) {}
export class UpdateDirectionDto extends createZodDto(
  CreateDirectionSchema.partial(),
) {}

export const DirectionQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  level: StudyLevelEnum.optional(),
});
export class DirectionQueryDto extends createZodDto(DirectionQuerySchema) {}
