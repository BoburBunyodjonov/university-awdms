import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { MonitoringService } from './monitoring.service';

@ApiTags('monitoring')
@ApiBearerAuth()
@Controller('monitoring')
@Roles('admin')
export class MonitoringController {
  constructor(private readonly monitoring: MonitoringService) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Department monitoring: totals, per-category/type hours, teacher loads vs annual norm (§4.9, §4.10)',
  })
  summary(@Query('academicYearId') academicYearId?: string) {
    return this.monitoring.summary(academicYearId);
  }

  @Get('unassigned')
  @ApiOperation({ summary: 'List unassigned workload items (§4.9)' })
  unassigned(@Query('academicYearId') academicYearId?: string) {
    return this.monitoring.unassigned(academicYearId);
  }
}
