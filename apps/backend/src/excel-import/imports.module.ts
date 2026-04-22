import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { WorkloadModule } from '../workload/workload.module';

@Module({
  imports: [WorkloadModule],
  controllers: [ImportsController],
  providers: [ImportsService],
})
export class ImportsModule {}
