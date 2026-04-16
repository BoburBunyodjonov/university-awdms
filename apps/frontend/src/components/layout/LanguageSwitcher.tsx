import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LABELS: Record<SupportedLanguage, string> = {
  uz: 'O‘zbek',
  ru: 'Русский',
  en: 'English',
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'uz') as SupportedLanguage;

  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-0.5 text-xs">
      <Languages className="ml-1 h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => void i18n.changeLanguage(lng)}
          className={cn(
            'rounded px-2 py-1 font-medium',
            lng === current
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:bg-zinc-100',
          )}
          aria-pressed={lng === current}
          aria-label={`Switch language to ${LABELS[lng]}`}
        >
          {LABELS[lng]}
        </button>
      ))}
    </div>
  );
}
