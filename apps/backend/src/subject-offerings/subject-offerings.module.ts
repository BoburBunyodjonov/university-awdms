import { Module } from '@nestjs/common';
import { SubjectOfferingsController } from './subject-offerings.controller';
import { SubjectOfferingsService } from './subject-offerings.service';

@Module({
  controllers: [SubjectOfferingsController],
  providers: [SubjectOfferingsService],
  exports: [SubjectOfferingsService],
})
export class SubjectOfferingsModule {}
