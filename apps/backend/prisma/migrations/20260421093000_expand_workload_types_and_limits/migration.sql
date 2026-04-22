-- Add new workload and formula scope enum values
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'individual_project';
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'phd_supervision_fulltime';
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'phd_supervision_parttime';

ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'individual_project';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'internship';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'prediploma';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'phd_supervision_fulltime';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'phd_supervision_parttime';

-- Add per-item student cap column (used by PhD-only workload types)
ALTER TABLE "workload_items"
ADD COLUMN IF NOT EXISTS "maxStudentsAllowed" INTEGER;
