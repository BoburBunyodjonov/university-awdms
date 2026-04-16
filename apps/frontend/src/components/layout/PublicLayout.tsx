import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export function PublicLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4">
        <Link to="/" className="text-sm font-semibold text-zinc-900">
          {t('app_name')}
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-4">
        <Outlet />
      </main>
    </div>
  );
}
