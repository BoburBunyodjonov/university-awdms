-- VQR: kunduzgi (to‘liq) vs sirtqi (qisman) alohida yuklama turlari
-- Only ALTER TYPE in this file: PG requires new enum values to be committed before
-- they can appear in UPDATEs (not safe in the same transaction as the UPDATEs below).
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'VQR_full_time';
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'VQR_part_time';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'VQR_full_time';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'VQR_part_time';
