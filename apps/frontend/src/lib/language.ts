import type { Language } from '@awdms/shared';

/** Barcha qo'llab-quvvatlanadigan ta'lim tillari (Prisma `Language` enum bilan mos). */
export const LANGUAGES: readonly Language[] = ['uzbek', 'russian', 'eng'];

export function languageBadgeClass(language: Language): string {
  const map: Record<Language, string> = {
    uzbek: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    russian: 'border-sky-200 bg-sky-50 text-sky-800',
    eng: 'border-violet-200 bg-violet-50 text-violet-800',
  };
  return map[language];
}
