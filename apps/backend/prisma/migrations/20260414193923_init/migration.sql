-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'teacher', 'student', 'guest');

-- CreateEnum
CREATE TYPE "StudyLevel" AS ENUM ('bachelor', 'master');

-- CreateEnum
CREATE TYPE "StudyType" AS ENUM ('full_time', 'part_time');

-- CreateEnum
CREATE TYPE "AcademicTerm" AS ENUM ('fall', 'spring');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('uzbek', 'russian');

-- CreateEnum
CREATE TYPE "WorkloadType" AS ENUM ('lecture', 'practice', 'lab', 'control', 'course_project', 'internship', 'prediploma', 'VQR', 'MD', 'NDP', 'NS');

-- CreateEnum
CREATE TYPE "WorkloadCategory" AS ENUM ('auditorium', 'non_auditorium');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('unassigned', 'assigned', 'invalid');

-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('draft', 'ready', 'assigned');

-- CreateEnum
CREATE TYPE "CalculationMode" AS ENUM ('coefficient_based', 'fixed_per_student', 'fixed_per_group', 'fixed_value');

-- CreateEnum
CREATE TYPE "FormulaScope" AS ENUM ('lecture', 'control', 'practice', 'lab', 'course_project', 'VQR', 'MD', 'NDP', 'NS');

-- CreateEnum
CREATE TYPE "AssignmentAction" AS ENUM ('assign', 'reassign', 'unassign');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('teacher', 'formula', 'stream', 'workload', 'assignment', 'user', 'group', 'direction', 'subject_offering', 'academic_year');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "teacherId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "degreeName" TEXT NOT NULL,
    "hasScientificDegree" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT NOT NULL,
    "annualNorm" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" "StudyLevel" NOT NULL,

    CONSTRAINT "directions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "directionId" UUID NOT NULL,
    "level" "StudyLevel" NOT NULL,
    "studyType" "StudyType" NOT NULL,
    "courseYear" INTEGER NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "academicTerm" "AcademicTerm" NOT NULL,
    "language" "Language" NOT NULL,
    "studentCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_offerings" (
    "id" UUID NOT NULL,
    "subjectName" TEXT NOT NULL,
    "directionId" UUID NOT NULL,
    "level" "StudyLevel" NOT NULL,
    "studyType" "StudyType" NOT NULL,
    "courseYear" INTEGER NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "academicTerm" "AcademicTerm" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_offering_groups" (
    "subjectOfferingId" UUID NOT NULL,
    "groupId" UUID NOT NULL,

    CONSTRAINT "subject_offering_groups_pkey" PRIMARY KEY ("subjectOfferingId","groupId")
);

-- CreateTable
CREATE TABLE "formula_configs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scopeType" "FormulaScope" NOT NULL,
    "level" "StudyLevel" NOT NULL,
    "studyType" "StudyType" NOT NULL,
    "calculationMode" "CalculationMode" NOT NULL,
    "baseHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coefficientPerStudent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedHoursPerStudent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedHoursPerGroup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formula_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecture_streams" (
    "id" UUID NOT NULL,
    "subjectOfferingId" UUID NOT NULL,
    "language" "Language" NOT NULL,
    "totalStudentCount" INTEGER NOT NULL DEFAULT 0,
    "lectureHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "controlHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "teacherId" UUID,
    "status" "StreamStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecture_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stream_groups" (
    "streamId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "subjectOfferingId" UUID NOT NULL,

    CONSTRAINT "stream_groups_pkey" PRIMARY KEY ("streamId","groupId")
);

-- CreateTable
CREATE TABLE "workload_items" (
    "id" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "subjectOfferingId" UUID,
    "lectureStreamId" UUID,
    "groupId" UUID,
    "workloadType" "WorkloadType" NOT NULL,
    "category" "WorkloadCategory" NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "plannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "formulaConfigId" UUID,
    "requiresDegree" BOOLEAN NOT NULL DEFAULT false,
    "assignedTeacherId" UUID,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'unassigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workload_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_logs" (
    "id" UUID NOT NULL,
    "workloadItemId" UUID NOT NULL,
    "oldTeacherId" UUID,
    "newTeacherId" UUID,
    "action" "AssignmentAction" NOT NULL,
    "performedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "performedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_teacherId_key" ON "users"("teacherId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "teachers_isActive_idx" ON "teachers"("isActive");

-- CreateIndex
CREATE INDEX "teachers_hasScientificDegree_idx" ON "teachers"("hasScientificDegree");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "directions_code_key" ON "directions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");

-- CreateIndex
CREATE INDEX "groups_directionId_idx" ON "groups"("directionId");

-- CreateIndex
CREATE INDEX "groups_academicTerm_courseYear_idx" ON "groups"("academicTerm", "courseYear");

-- CreateIndex
CREATE INDEX "subject_offerings_directionId_idx" ON "subject_offerings"("directionId");

-- CreateIndex
CREATE INDEX "subject_offerings_academicTerm_courseYear_semesterNumber_idx" ON "subject_offerings"("academicTerm", "courseYear", "semesterNumber");

-- CreateIndex
CREATE INDEX "subject_offering_groups_groupId_idx" ON "subject_offering_groups"("groupId");

-- CreateIndex
CREATE INDEX "formula_configs_scopeType_level_studyType_isActive_idx" ON "formula_configs"("scopeType", "level", "studyType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "formula_configs_scopeType_level_studyType_effectiveFrom_key" ON "formula_configs"("scopeType", "level", "studyType", "effectiveFrom");

-- CreateIndex
CREATE INDEX "lecture_streams_subjectOfferingId_idx" ON "lecture_streams"("subjectOfferingId");

-- CreateIndex
CREATE INDEX "lecture_streams_teacherId_idx" ON "lecture_streams"("teacherId");

-- CreateIndex
CREATE INDEX "lecture_streams_status_idx" ON "lecture_streams"("status");

-- CreateIndex
CREATE INDEX "stream_groups_groupId_idx" ON "stream_groups"("groupId");

-- CreateIndex
CREATE INDEX "stream_groups_subjectOfferingId_idx" ON "stream_groups"("subjectOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "stream_groups_groupId_subjectOfferingId_key" ON "stream_groups"("groupId", "subjectOfferingId");

-- CreateIndex
CREATE INDEX "workload_items_academicYearId_idx" ON "workload_items"("academicYearId");

-- CreateIndex
CREATE INDEX "workload_items_assignedTeacherId_idx" ON "workload_items"("assignedTeacherId");

-- CreateIndex
CREATE INDEX "workload_items_status_idx" ON "workload_items"("status");

-- CreateIndex
CREATE INDEX "workload_items_workloadType_category_idx" ON "workload_items"("workloadType", "category");

-- CreateIndex
CREATE INDEX "workload_items_lectureStreamId_idx" ON "workload_items"("lectureStreamId");

-- CreateIndex
CREATE INDEX "workload_items_subjectOfferingId_idx" ON "workload_items"("subjectOfferingId");

-- CreateIndex
CREATE INDEX "assignment_logs_workloadItemId_idx" ON "assignment_logs"("workloadItemId");

-- CreateIndex
CREATE INDEX "assignment_logs_performedByUserId_idx" ON "assignment_logs"("performedByUserId");

-- CreateIndex
CREATE INDEX "assignment_logs_createdAt_idx" ON "assignment_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_performedByUserId_idx" ON "audit_logs"("performedByUserId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "directions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_offerings" ADD CONSTRAINT "subject_offerings_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "directions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_offering_groups" ADD CONSTRAINT "subject_offering_groups_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "subject_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_offering_groups" ADD CONSTRAINT "subject_offering_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_streams" ADD CONSTRAINT "lecture_streams_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "subject_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_streams" ADD CONSTRAINT "lecture_streams_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_groups" ADD CONSTRAINT "stream_groups_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "lecture_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_groups" ADD CONSTRAINT "stream_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_groups" ADD CONSTRAINT "stream_groups_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "subject_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workload_items" ADD CONSTRAINT "workload_items_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workload_items" ADD CONSTRAINT "workload_items_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "subject_offerings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workload_items" ADD CONSTRAINT "workload_items_lectureStreamId_fkey" FOREIGN KEY ("lectureStreamId") REFERENCES "lecture_streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workload_items" ADD CONSTRAINT "workload_items_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workload_items" ADD CONSTRAINT "workload_items_formulaConfigId_fkey" FOREIGN KEY ("formulaConfigId") REFERENCES "formula_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workload_items" ADD CONSTRAINT "workload_items_assignedTeacherId_fkey" FOREIGN KEY ("assignedTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_logs" ADD CONSTRAINT "assignment_logs_workloadItemId_fkey" FOREIGN KEY ("workloadItemId") REFERENCES "workload_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_logs" ADD CONSTRAINT "assignment_logs_oldTeacherId_fkey" FOREIGN KEY ("oldTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_logs" ADD CONSTRAINT "assignment_logs_newTeacherId_fkey" FOREIGN KEY ("newTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_logs" ADD CONSTRAINT "assignment_logs_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
