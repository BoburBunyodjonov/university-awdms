import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { WorkloadService } from './workload.service';

// §3.2 — teachers can only see their own workload. The current user's JWT
// carries the teacherId; we refuse with 400 if the account has no linked
// Teacher profile (happens when an admin user or an orphan teacher user hits
// this endpoint).
@ApiTags('my-workload')
@ApiBearerAuth()
@Controller('my-workload')
@Roles('teacher')
export class MyWorkloadController {
  constructor(private readonly workload: WorkloadService) {}

  @Get()
  @ApiOperation({
    summary: "List the current teacher's assigned workload items (§4.10)",
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('academicYearId') academicYearId?: string,
  ) {
    if (!user.teacherId) {
      throw new BadRequestException(
        'Your user account is not linked to a teacher profile',
      );
    }
    return this.workload.teacherSummary(user.teacherId, academicYearId);
  }
}
