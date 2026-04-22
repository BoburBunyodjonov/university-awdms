-- Data migration after enum values exist (separate transaction from 20260422150000).
UPDATE workload_items SET "workloadType" = 'VQR_full_time' WHERE "workloadType" = 'VQR';
UPDATE formula_configs SET "scopeType" = 'VQR_full_time' WHERE "scopeType" = 'VQR';
