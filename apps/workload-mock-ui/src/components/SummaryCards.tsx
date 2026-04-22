import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

export interface SummaryItem {
  label: string;
  value: string;
  hint?: string;
  /** numeric accent for color bar */
  variant?: 'default' | 'emerald' | 'indigo' | 'amber' | 'rose';
}

const bar: Record<NonNullable<SummaryItem['variant']>, string> = {
  default: 'from-zinc-400 to-zinc-500',
  emerald: 'from-emerald-400 to-emerald-600',
  indigo: 'from-indigo-400 to-violet-600',
  amber: 'from-amber-400 to-orange-500',
  rose: 'from-rose-400 to-rose-600',
};

export function SummaryCards({
  items,
  loading,
}: {
  items: SummaryItem[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card"
          >
            <div className="h-3 w-24 rounded bg-zinc-200" />
            <div className="mt-4 h-8 w-20 rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-32 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-lg"
        >
          <div
            className={cn(
              'absolute left-0 top-0 h-1 w-full bg-gradient-to-r',
              bar[item.variant ?? 'default'],
            )}
          />
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-1 text-xs text-zinc-500">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-500">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">Yuklanmoqda…</p>
    </div>
  );
}
