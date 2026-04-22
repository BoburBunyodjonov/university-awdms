import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { TeachersService } from './teachers.service';

/**
 * Self-service teacher profile (teacher_workload_module.md JSON shape).
 * Full workload rows: GET /my-workload
 */
@ApiTags('teacher')
@ApiBearerAuth()
@Controller('teacher')
@Roles('teacher')
export class TeacherProfileController {
  constructor(private readonly teachers: TeachersService) {}

  @Get('profile')
  @ApiOperation({
    summary:
      'GET /api/teacher/profile — current user’s teacher profile (module shape)',
  })
  profile(@CurrentUser() user: AuthenticatedUser) {
    if (!user.teacherId) {
      throw new BadRequestException(
        'Your account is not linked to a teacher profile',
      );
    }
    return this.teachers.getModuleProfile(user.teacherId);
  }
}
