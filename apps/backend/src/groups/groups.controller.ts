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
  CreateGroupDto,
  GroupQueryDto,
  UpdateGroupDto,
} from './dto/group.dto';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
@Roles('admin')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List groups (§4.3) — paginated, filterable' })
  list(@Query() query: GroupQueryDto) {
    return this.groups.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a group (§4.3)' })
  create(@Body() dto: CreateGroupDto) {
    return this.groups.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.groups.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groups.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.groups.remove(id);
  }
}
