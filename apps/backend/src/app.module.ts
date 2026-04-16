import { Module } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeachersModule } from './teachers/teachers.module';
import { DirectionsModule } from './directions/directions.module';
import { GroupsModule } from './groups/groups.module';
import { SubjectsModule } from './subjects/subjects.module';
import { FormulasModule } from './formulas/formulas.module';
import { SubjectOfferingsModule } from './subject-offerings/subject-offerings.module';
import { LectureStreamsModule } from './lecture-streams/lecture-streams.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { WorkloadModule } from './workload/workload.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { ExportsModule } from './exports/exports.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    TeachersModule,
    DirectionsModule,
    GroupsModule,
    SubjectsModule,
    FormulasModule,
    SubjectOfferingsModule,
    LectureStreamsModule,
    AcademicYearsModule,
    WorkloadModule,
    MonitoringModule,
    ExportsModule,
  ],
  providers: [
    // Every endpoint is protected by default — use @Public() to opt out.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global Zod validation for any DTO defined via createZodDto().
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
