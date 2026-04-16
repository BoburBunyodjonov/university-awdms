import { Module } from '@nestjs/common';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [MonitoringModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
