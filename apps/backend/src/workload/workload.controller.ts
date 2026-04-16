import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import {
  AssignWorkloadDto,
  CreateWorkloadItemDto,
  GenerateWorkloadDto,
  ReassignWorkloadDto,
  UnassignWorkloadDto,
  UpdateWorkloadItemDto,
  WorkloadQueryDto,
} from './dto/workload-item.dto';
import { WorkloadService } from './workload.service';

@ApiTags('workload')
@ApiBearerAuth()
@Controller('workload')
@Roles('admin')
export class WorkloadController {
  constructor(private readonly workload: WorkloadService) {}

  @Get()
  @ApiOperation({ summary: 'List workload items (§4.7)' })
  list(@Query() query: WorkloadQueryDto) {
    return this.workload.list(query);
  }

  @Post()
  create(@Body() dto: CreateWorkloadItemDto) {
    return this.workload.create(dto);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate lecture/control/practice items from active subject offerings',
  })
  generate(@Body() dto: GenerateWorkloadDto) {
    return this.workload.generate(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.workload.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWorkloadItemDto,
  ) {
    return this.workload.update(id, dto);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a teacher (Rule 1 + Rule 13 enforced)' })
  assign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignWorkloadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workload.assign(id, dto, user.id);
  }

  @Post(':id/reassign')
  @HttpCode(HttpStatus.OK)
  reassign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReassignWorkloadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workload.reassign(id, dto, user.id);
  }

  @Post(':id/unassign')
  @HttpCode(HttpStatus.OK)
  unassign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UnassignWorkloadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workload.unassign(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.workload.remove(id);
  }
}
