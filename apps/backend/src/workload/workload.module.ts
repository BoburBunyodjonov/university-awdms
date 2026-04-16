import { Module } from '@nestjs/common';
import { WorkloadController } from './workload.controller';
import { MyWorkloadController } from './my-workload.controller';
import { WorkloadService } from './workload.service';

@Module({
  controllers: [WorkloadController, MyWorkloadController],
  providers: [WorkloadService],
  exports: [WorkloadService],
})
export class WorkloadModule {}
