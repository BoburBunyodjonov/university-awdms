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
  CreateFormulaDto,
  FormulaQueryDto,
  PreviewFormulaDto,
  UpdateFormulaDto,
} from './dto/formula.dto';
import { FormulasService } from './formulas.service';

// Rule 14: formulas can only be edited by admin.
@ApiTags('formulas')
@ApiBearerAuth()
@Controller('formulas')
@Roles('admin')
export class FormulasController {
  constructor(private readonly formulas: FormulasService) {}

  @Get()
  @ApiOperation({ summary: 'List formula configs (§4.5)' })
  list(@Query() query: FormulaQueryDto) {
    return this.formulas.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a formula (§4.5)' })
  create(@Body() dto: CreateFormulaDto) {
    return this.formulas.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.formulas.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFormulaDto,
  ) {
    return this.formulas.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete or soft-deactivate if referenced by workload',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.formulas.remove(id);
  }

  @Post(':id/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview planned hours without persisting' })
  preview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PreviewFormulaDto,
  ) {
    return this.formulas.preview(id, dto);
  }
}
