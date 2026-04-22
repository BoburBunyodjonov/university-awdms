import type { WorkloadItemWithRelations } from '@/features/workload/api';

function fmtNum(x: number): string {
  if (!Number.isFinite(x) || x === 0) return '—';
  return Math.abs(x - Math.round(x)) < 1e-6
    ? String(Math.round(x))
    : String(Number(x.toFixed(4)));
}

/** Primary parameter shown for the row’s linked formula (mode-dependent). */
export function formatPrimaryCoefficient(
  f: WorkloadItemWithRelations['formulaConfig'],
): string {
  if (!f) return '—';
  switch (f.calculationMode) {
    case 'coefficient_based':
      if (f.coefficientPerStudent > 0) return fmtNum(f.coefficientPerStudent);
      if (f.baseHours > 0) return `base ${fmtNum(f.baseHours)}`;
      return '—';
    case 'fixed_per_student':
      return fmtNum(f.fixedHoursPerStudent);
    case 'fixed_per_group':
      return fmtNum(f.fixedHoursPerGroup);
    case 'fixed_value':
      return fmtNum(f.fixedValue);
    default:
      return f.name;
  }
}
