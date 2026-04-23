import type { AcademicTerm } from '../types/enums';

/**
 * How UI and APIs split a teacher’s workload by subject offering’s term.
 * `unknown` = no linked offering, or a term that is not fall/spring (future-safe).
 */
export type WorkloadTermBucket = 'fall' | 'spring' | 'unknown';

export function workloadTermBucket(item: {
  subjectOffering: { academicTerm: AcademicTerm } | null | undefined;
}): WorkloadTermBucket {
  const o = item.subjectOffering;
  if (o == null) return 'unknown';
  if (o.academicTerm === 'fall') return 'fall';
  if (o.academicTerm === 'spring') return 'spring';
  return 'unknown';
}
