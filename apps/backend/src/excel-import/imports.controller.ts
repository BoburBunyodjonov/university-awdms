import {
  BadRequestException,
  Controller,
  ParseBoolPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { ImportsService } from './imports.service';

@ApiTags('import')
@ApiBearerAuth()
@Controller('import')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Post('workload-excel')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import workload from Excel template (preview or commit with overwrite mode)',
  })
  async importWorkloadExcel(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Query('preview', new ParseBoolPipe({ optional: true })) preview = true,
    @Query('overwrite', new ParseBoolPipe({ optional: true })) overwrite = false,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.imports.importWorkloadExcel({
      file,
      preview,
      overwrite,
      performedByUserId: user.id,
    });
  }
}
