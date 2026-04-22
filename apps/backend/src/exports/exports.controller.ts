import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { ExportsService } from './exports.service';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('export')
@ApiBearerAuth()
@Controller('export')
export class ExportsController {
  constructor(private readonly exports: ExportsService) {}

  @Get('department/excel')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Full department workload report as .xlsx (Summary + Teachers + Items)',
  })
  async department(
    @Query('academicYearId') academicYearId: string,
    @Res() res: Response,
  ) {
    if (!academicYearId) {
      throw new BadRequestException('academicYearId is required');
    }
    const buffer = await this.exports.departmentWorkbook(academicYearId);
    res.set({
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename="awdms-department-${academicYearId.slice(0, 8)}.xlsx"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Get('teacher/:id/excel')
  @Roles('admin')
  @ApiOperation({ summary: "A single teacher's individual workload report" })
  async teacher(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('academicYearId') academicYearId: string | undefined,
    @Res() res: Response,
  ) {
    const yearId = await this.exports.resolveAcademicYearId(academicYearId);
    const buffer = await this.exports.teacherWorkbook(id, yearId);
    res.set({
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename="awdms-teacher-${id.slice(0, 8)}.xlsx"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  /** Module spec: GET /api/export/teacher/:id (same file as /excel) */
  @Get('teacher/:id')
  @Roles('admin')
  @ApiOperation({
    summary: 'GET /api/export/teacher/:id — Excel export (year defaults to active)',
  })
  async teacherModuleAlias(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('academicYearId') academicYearId: string | undefined,
    @Res() res: Response,
  ) {
    const yearId = await this.exports.resolveAcademicYearId(academicYearId);
    const buffer = await this.exports.teacherWorkbook(id, yearId);
    res.set({
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename="awdms-teacher-${id.slice(0, 8)}.xlsx"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Get('my/excel')
  @Roles('teacher')
  @ApiOperation({
    summary: "The current teacher's own workload report (self-service)",
  })
  async myExport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('academicYearId') academicYearId: string,
    @Res() res: Response,
  ) {
    if (!user.teacherId) {
      throw new BadRequestException(
        'Your user account is not linked to a teacher profile',
      );
    }
    if (!academicYearId) {
      throw new BadRequestException('academicYearId is required');
    }
    const buffer = await this.exports.teacherWorkbook(
      user.teacherId,
      academicYearId,
    );
    res.set({
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename="awdms-my-workload.xlsx"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }
}
