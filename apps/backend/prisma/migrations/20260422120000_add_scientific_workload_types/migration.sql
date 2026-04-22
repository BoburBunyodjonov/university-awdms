-- PhD non-auditorium types from module spec (scientific-pedagogical + scientific-internship).
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'scientific_pedagogical';
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'scientific_internship';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'scientific_pedagogical';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'scientific_internship';
