import { Module } from '@nestjs/common';
import { WorkloadModule } from '../workload/workload.module';
import { TeachersController } from './teachers.controller';
import { TeacherProfileController } from './teacher-profile.controller';
import { TeachersService } from './teachers.service';

@Module({
  imports: [WorkloadModule],
  controllers: [TeachersController, TeacherProfileController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
