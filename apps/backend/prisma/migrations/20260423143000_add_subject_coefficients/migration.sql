-- Add per-subject coefficients for auditorium workload calculations.
ALTER TABLE "subjects"
ADD COLUMN "lectureCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "controlCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "practiceCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 0;
