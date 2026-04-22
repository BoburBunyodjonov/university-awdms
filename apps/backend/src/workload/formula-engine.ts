import { $Enums, type FormulaConfig } from '@prisma/client';

type FormulaFields = Pick<
  FormulaConfig,
  | 'calculationMode'
  | 'baseHours'
  | 'coefficientPerStudent'
  | 'fixedHoursPerStudent'
  | 'fixedHoursPerGroup'
  | 'fixedValue'
> & { scopeType: $Enums.FormulaScope };

/**
 * Evaluator for planned hours aligned with `teacher_workload_module.md` and §4.5.
 * Uses `scopeType` to pick the right shape; `calculationMode` selects which
 * numeric field is the primary driver.
 *
 * A single `switch (f.scopeType)` (with string `case` labels) replaces a long
 * chain of `if (scope === …)` on `const scope = f.scopeType`, which made
 * TypeScript over-narrow the enum so later checks looked “impossible”.
 */
export function evaluateFormula(
  f: FormulaFields,
  studentCount: number,
  groupCount = 1,
): number {
  const sc = Math.max(0, studentCount);
  const gc = Math.max(1, groupCount);

  // Compare as `string` so toolchains with a narrowed Prisma `FormulaScope` type
  // (missing newer enum members) still accept every case label.
  switch (f.scopeType as string) {
    case 'lecture':
      if (f.calculationMode === 'fixed_value') return f.fixedValue;
      if (f.calculationMode === 'fixed_per_group') return f.fixedHoursPerGroup * gc;
      if (f.calculationMode === 'coefficient_based') return f.baseHours;
      return f.fixedValue || f.baseHours;

    case 'practice':
      if (f.calculationMode === 'fixed_per_group') return f.fixedHoursPerGroup * gc;
      if (f.calculationMode === 'fixed_value') return f.fixedValue;
      return f.fixedHoursPerGroup * gc;

    case 'control':
      if (f.calculationMode === 'fixed_per_student') return f.fixedHoursPerStudent * sc;
      if (f.calculationMode === 'coefficient_based') return f.coefficientPerStudent * sc;
      return f.fixedValue;

    case 'lab':
      if (f.calculationMode === 'fixed_per_group') return f.fixedHoursPerGroup * gc;
      if (f.calculationMode === 'coefficient_based') return f.baseHours * gc;
      return f.fixedValue;

    case 'individual_project':
      return f.coefficientPerStudent * sc * gc;

    case 'course_project':
      if (f.calculationMode === 'fixed_value') return f.fixedValue;
      return f.fixedValue;

    case 'internship':
    case 'prediploma':
      if (f.calculationMode === 'fixed_per_student') return f.fixedHoursPerStudent * sc;
      return f.fixedValue * sc;

    case 'VQR':
    case 'VQR_full_time':
    case 'VQR_part_time':
    case 'MD':
    case 'NDP':
    case 'NS':
    case 'phd_supervision_fulltime':
    case 'phd_supervision_parttime':
    case 'scientific_pedagogical':
    case 'scientific_internship':
      if (f.calculationMode === 'fixed_per_student') return f.fixedHoursPerStudent * sc;
      if (f.calculationMode === 'coefficient_based') return f.coefficientPerStudent * sc;
      return f.fixedValue;

    default:
      throw new Error(`Unknown formula scope: ${String(f.scopeType)}`);
  }
}
