/*
  Warnings:

  - You are about to drop the column `directionId` on the `subject_offerings` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `subject_offerings` table. All the data in the column will be lost.
  - You are about to drop the column `subjectName` on the `subject_offerings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subjectId,studyType,academicTerm,courseYear,semesterNumber]` on the table `subject_offerings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subjectId` to the `subject_offerings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "subject_offerings" DROP CONSTRAINT "subject_offerings_directionId_fkey";

-- DropIndex
DROP INDEX "subject_offerings_directionId_idx";

-- AlterTable
ALTER TABLE "subject_offerings" DROP COLUMN "directionId",
DROP COLUMN "level",
DROP COLUMN "subjectName",
ADD COLUMN     "subjectId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "directionId" UUID NOT NULL,
    "level" "StudyLevel" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subjects_directionId_idx" ON "subjects"("directionId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_directionId_name_key" ON "subjects"("directionId", "name");

-- CreateIndex
CREATE INDEX "subject_offerings_subjectId_idx" ON "subject_offerings"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_offerings_subjectId_studyType_academicTerm_courseYe_key" ON "subject_offerings"("subjectId", "studyType", "academicTerm", "courseYear", "semesterNumber");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "directions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_offerings" ADD CONSTRAINT "subject_offerings_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
