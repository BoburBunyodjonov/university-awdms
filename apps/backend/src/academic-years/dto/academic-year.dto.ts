import { createZodDto } from 'nestjs-zod';
import { CreateAcademicYearSchema } from '@awdms/shared';

export class CreateAcademicYearDto extends createZodDto(
  CreateAcademicYearSchema,
) {}
export class UpdateAcademicYearDto extends createZodDto(
  CreateAcademicYearSchema.innerType().partial(),
) {}
