import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  BookOpen,
  CalendarRange,
  ClipboardList,
  Compass,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Radio,
  ShieldAlert,
  Sigma,
  Users,
} from 'lucide-react';
import { ADMIN_ROLES } from '@awdms/shared';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

// §9 — desktop-first admin shell. Sidebar + topbar + scrollable main.
// Icon + text for every nav item per §9.3.
const NAV = [
  { to: '/admin', i18nKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/teachers', i18nKey: 'nav.teachers', icon: Users },
  { to: '/admin/directions', i18nKey: 'nav.directions', icon: Compass },
  { to: '/admin/groups', i18nKey: 'nav.groups', icon: GraduationCap },
  { to: '/admin/subjects', i18nKey: 'nav.subjects', icon: BookOpen },
  { to: '/admin/subject-offerings', i18nKey: 'nav.offerings', icon: CalendarRange },
  { to: '/admin/formulas', i18nKey: 'nav.formulas', icon: Sigma },
  { to: '/admin/workload', i18nKey: 'nav.workload', icon: ClipboardList },
  { to: '/admin/streams', i18nKey: 'nav.streams', icon: Radio },
  { to: '/admin/monitoring', i18nKey: 'nav.monitoring', icon: ShieldAlert },
  { to: '/admin/statistics', i18nKey: 'nav.statistics', icon: BarChart3 },
  { to: '/admin/reports', i18nKey: 'nav.reports', icon: FileSpreadsheet },
] as const;

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clear);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <RoleGuard allow={ADMIN_ROLES}>
      <div className="flex min-h-screen bg-zinc-50">
        <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
          <Link
            to="/admin"
            className="flex h-14 items-center border-b border-zinc-200 px-4 text-sm font-semibold text-zinc-900"
          >
            {t('app_name')}
          </Link>
          <nav className="flex-1 overflow-y-auto p-2" aria-label="Admin">
            <ul className="space-y-0.5">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={'end' in item ? item.end : false}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                        isActive
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-700 hover:bg-zinc-100',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{t(item.i18nKey)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4">
            <div className="text-sm text-zinc-500">Admin</div>
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
          <main className="flex-1 overflow-auto p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
