-- VQR: kunduzgi (to‘liq) vs sirtqi (qisman) alohida yuklama turlari
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'VQR_full_time';
ALTER TYPE "WorkloadType" ADD VALUE IF NOT EXISTS 'VQR_part_time';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'VQR_full_time';
ALTER TYPE "FormulaScope" ADD VALUE IF NOT EXISTS 'VQR_part_time';

UPDATE workload_items SET "workloadType" = 'VQR_full_time' WHERE "workloadType" = 'VQR';
UPDATE formula_configs SET "scopeType" = 'VQR_full_time' WHERE "scopeType" = 'VQR';
