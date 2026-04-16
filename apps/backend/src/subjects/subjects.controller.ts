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
  CreateSubjectDto,
  SubjectQueryDto,
  UpdateSubjectDto,
} from './dto/subject.dto';
import { SubjectsService } from './subjects.service';

@ApiTags('subjects')
@ApiBearerAuth()
@Controller('subjects')
@Roles('admin')
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List subjects (catalog)' })
  list(@Query() query: SubjectQueryDto) {
    return this.subjects.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a subject (§4.4)' })
  create(@Body() dto: CreateSubjectDto) {
    return this.subjects.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.subjects.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjects.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.subjects.remove(id);
  }
}
