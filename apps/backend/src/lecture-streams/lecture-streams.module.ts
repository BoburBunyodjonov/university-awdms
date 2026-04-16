import { Module } from '@nestjs/common';
import { LectureStreamsController } from './lecture-streams.controller';
import { LectureStreamsService } from './lecture-streams.service';

@Module({
  controllers: [LectureStreamsController],
  providers: [LectureStreamsService],
  exports: [LectureStreamsService],
})
export class LectureStreamsModule {}
