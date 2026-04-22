import { Award, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import type { Degree } from '@/types';

export function TeacherCard({
  id,
  name,
  degree,
  totalHours,
  remainingNorm,
  onAssign,
  compact,
}: {
  id: string;
  name: string;
  degree: Degree;
  totalHours: number;
  remainingNorm: number;
  onAssign: () => void;
  compact?: boolean;
}) {
  const phd = degree === 'PhD';
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card',
        compact && 'p-4',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              phd
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-zinc-100 text-zinc-600',
            )}
          >
            {phd ? <Award className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">{name}</h3>
            <p className="text-xs text-zinc-500">
              {phd ? 'PhD' : 'No degree'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-zinc-900">
            {totalHours.toFixed(0)}h
          </p>
          <p className="text-xs text-zinc-500">assigned</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-dashed border-zinc-200 pt-3 text-sm">
        <span className="text-zinc-500">Remaining norm</span>
        <span
          className={cn(
            'font-medium',
            remainingNorm < 0 ? 'text-rose-600' : 'text-emerald-700',
          )}
        >
          {remainingNorm.toFixed(0)}h
        </span>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/teachers/${id}`}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          View profile
        </Link>
        <button
          type="button"
          onClick={onAssign}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Assign
        </button>
      </div>
    </div>
  );
}
