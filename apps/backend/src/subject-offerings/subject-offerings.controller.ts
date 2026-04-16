import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateSubjectOfferingDto,
  LinkGroupsDto,
  SubjectOfferingQueryDto,
  UpdateSubjectOfferingDto,
} from './dto/subject-offering.dto';
import { SubjectOfferingsService } from './subject-offerings.service';

@ApiTags('subject-offerings')
@ApiBearerAuth()
@Controller('subject-offerings')
@Roles('admin')
export class SubjectOfferingsController {
  constructor(private readonly offerings: SubjectOfferingsService) {}

  @Get()
  @ApiOperation({ summary: 'List subject offerings (§4.4) — with group links' })
  list(@Query() query: SubjectOfferingQueryDto) {
    return this.offerings.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create an offering and optionally link groups' })
  create(@Body() dto: CreateSubjectOfferingDto) {
    return this.offerings.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.offerings.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSubjectOfferingDto,
  ) {
    return this.offerings.update(id, dto);
  }

  @Put(':id/groups')
  @ApiOperation({
    summary: 'Replace the full set of linked groups for this offering',
  })
  setGroups(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LinkGroupsDto,
  ) {
    return this.offerings.setGroups(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.offerings.remove(id);
  }
}
