import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateTeacherDto,
  TeacherQueryDto,
  UpdateTeacherDto,
} from './dto/teacher.dto';
import { TeachersService } from './teachers.service';
import { WorkloadService } from '../workload/workload.service';

// §3.1: Admin manages teachers. Teacher role has separate self-read endpoints
// (/api/teachers/:id/workload etc) which will arrive with the workload module.
@ApiTags('teachers')
@ApiBearerAuth()
@Controller('teachers')
@Roles('admin')
export class TeachersController {
  constructor(
    private readonly teachers: TeachersService,
    private readonly workload: WorkloadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List teachers (paginated, searchable)' })
  list(@Query() query: TeacherQueryDto) {
    return this.teachers.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a teacher (§4.2)' })
  create(@Body() dto: CreateTeacherDto) {
    return this.teachers.create(dto);
  }

  @Get(':id/workload')
  @ApiOperation({
    summary: 'GET /api/teachers/:id/workload — full summary + items (module spec)',
  })
  teacherWorkload(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.workload.teacherSummary(id, academicYearId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a teacher by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.teachers.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a teacher (§4.2)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teachers.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Deactivate or delete a teacher — soft-deleted if referenced by workload',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.teachers.remove(id);
  }
}
