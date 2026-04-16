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
  CreateDirectionDto,
  DirectionQueryDto,
  UpdateDirectionDto,
} from './dto/direction.dto';
import { DirectionsService } from './directions.service';

@ApiTags('directions')
@ApiBearerAuth()
@Controller('directions')
@Roles('admin')
export class DirectionsController {
  constructor(private readonly directions: DirectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List directions (§4.3)' })
  list(@Query() query: DirectionQueryDto) {
    return this.directions.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a direction' })
  create(@Body() dto: CreateDirectionDto) {
    return this.directions.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.directions.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDirectionDto,
  ) {
    return this.directions.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.directions.remove(id);
  }
}
