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
import {
  AssignStreamTeacherDto,
  CreateLectureStreamDto,
  LectureStreamQueryDto,
  UpdateLectureStreamDto,
} from './dto/lecture-stream.dto';
import { LectureStreamsService } from './lecture-streams.service';

@ApiTags('lecture-streams')
@ApiBearerAuth()
// Spec §8.6: `/api/streams`.
@Controller('streams')
@Roles('admin')
export class LectureStreamsController {
  constructor(private readonly streams: LectureStreamsService) {}

  @Get()
  @ApiOperation({ summary: 'List lecture streams (§4.6)' })
  list(@Query() query: LectureStreamQueryDto) {
    return this.streams.list(query);
  }

  @Post()
  @ApiOperation({
    summary:
      'Create a lecture stream — validates language consistency (Rule 8)',
  })
  create(@Body() dto: CreateLectureStreamDto) {
    return this.streams.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.streams.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLectureStreamDto,
  ) {
    return this.streams.update(id, dto);
  }

  @Post(':id/assign-teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a teacher to the stream (§8.6)' })
  assignTeacher(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignStreamTeacherDto,
  ) {
    return this.streams.assignTeacher(id, dto);
  }

  @Delete(':id/teacher')
  @ApiOperation({ summary: 'Unassign the stream teacher' })
  unassignTeacher(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.streams.unassignTeacher(id);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.streams.remove(id);
  }
}
