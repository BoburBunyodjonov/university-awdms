import { Filter } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SemesterFilter, WorkloadCategory, WorkloadKind } from '@/types';
import { KIND_LABEL } from '@/types';

const ALL_KINDS: WorkloadKind[] = [
  'lecture',
  'practice',
  'control',
  'individual_project',
  'vqr_day',
  'vqr_parttime',
  'internship',
  'prediploma',
  'scientific_pedagogical',
  'scientific_internship',
  'phd_supervision_parttime',
  'phd_supervision_fulltime',
];

export function FiltersPanel({
  semester,
  onSemester,
  type,
  onType,
  category,
  onCategory,
  className,
}: {
  semester: SemesterFilter;
  onSemester: (s: SemesterFilter) => void;
  type: WorkloadKind | 'all';
  onType: (t: WorkloadKind | 'all') => void;
  category: WorkloadCategory | 'all';
  onCategory: (c: WorkloadCategory | 'all') => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-soft lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-zinc-700">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Semester
          </span>
          <select
            value={semester}
            onChange={(e) => onSemester(e.target.value as SemesterFilter)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm shadow-sm"
          >
            <option value="all">All</option>
            <option value="fall">Fall</option>
            <option value="spring">Spring</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Workload type
          </span>
          <select
            value={type}
            onChange={(e) =>
              onType(e.target.value as WorkloadKind | 'all')
            }
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm shadow-sm"
          >
            <option value="all">All types</option>
            {ALL_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Category
          </span>
          <select
            value={category}
            onChange={(e) =>
              onCategory(e.target.value as WorkloadCategory | 'all')
            }
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm shadow-sm"
          >
            <option value="all">All</option>
            <option value="auditorium">Auditorium</option>
            <option value="non_auditorium">Non-auditorium</option>
          </select>
        </label>
      </div>
    </div>
  );
}
