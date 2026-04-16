import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {t('app_name')}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Academic Workload Distribution & Management System
        </p>
      </div>
      <Link to="/login">
        <Button>{t('auth.login')}</Button>
      </Link>
    </section>
  );
}
