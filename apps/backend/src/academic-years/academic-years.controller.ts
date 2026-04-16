import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
} from './dto/academic-year.dto';
import { AcademicYearsService } from './academic-years.service';

@ApiTags('academic-years')
@ApiBearerAuth()
@Controller('academic-years')
@Roles('admin')
export class AcademicYearsController {
  constructor(private readonly years: AcademicYearsService) {}

  @Get()
  @ApiOperation({ summary: 'List academic years (§4.3)' })
  list() {
    return this.years.list();
  }

  @Post()
  create(@Body() dto: CreateAcademicYearDto) {
    return this.years.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.years.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.years.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.years.remove(id);
  }
}
