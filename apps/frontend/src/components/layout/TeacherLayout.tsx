import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  User,
} from 'lucide-react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/teacher', i18nKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/teacher/load', i18nKey: 'nav.workload', icon: ClipboardList },
  { to: '/teacher/statistics', i18nKey: 'nav.statistics', icon: BarChart3 },
  { to: '/teacher/profile', i18nKey: 'nav.profile', icon: User },
] as const;

export function TeacherLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clear);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <RoleGuard allow={['teacher', 'admin']}>
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4">
          <Link to="/teacher" className="text-sm font-semibold text-zinc-900">
            {t('app_name')}
          </Link>
          <nav className="flex items-center gap-1" aria-label="Teacher">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100',
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span>{t(item.i18nKey)}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label={t('nav.logout')}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{t('nav.logout')}</span>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </RoleGuard>
  );
}
