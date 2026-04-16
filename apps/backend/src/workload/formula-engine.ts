import type { FormulaConfig } from '@prisma/client';

/**
 * Pure evaluator for formula-driven planned hours (§4.5).
 * Same logic as FormulasService.preview, extracted so the workload generator
 * and the formula preview endpoint share one source of truth.
 */
export function evaluateFormula(
  f: Pick<
    FormulaConfig,
    | 'calculationMode'
    | 'baseHours'
    | 'coefficientPerStudent'
    | 'fixedHoursPerStudent'
    | 'fixedHoursPerGroup'
    | 'fixedValue'
  >,
  studentCount: number,
  groupCount = 1,
): number {
  switch (f.calculationMode) {
    case 'coefficient_based':
      return f.baseHours + f.coefficientPerStudent * studentCount;
    case 'fixed_per_student':
      return f.fixedHoursPerStudent * studentCount;
    case 'fixed_per_group':
      return f.fixedHoursPerGroup * groupCount;
    case 'fixed_value':
      return f.fixedValue;
  }
}
