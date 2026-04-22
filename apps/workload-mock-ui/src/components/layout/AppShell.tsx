import { Link, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/cn';

const links = [
  { to: '/', label: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/teachers', label: "O'qituvchilar", icon: Users, end: false },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-100/80">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-zinc-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Akademik Yuklamalar</span>
              <span className="text-[10px] font-medium text-zinc-500">
                2024–2025 · 1-semestr
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-0.5">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100',
                  )
                }
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200/60 bg-white py-6 text-center text-xs text-zinc-500">
        Mock UI — backendsiz. React + Tailwind asosida.
      </footer>
    </div>
  );
}
