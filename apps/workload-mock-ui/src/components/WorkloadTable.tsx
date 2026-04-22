import { KIND_SHORT_LABEL, type WorkloadAssignment, type WorkloadKind } from '@/types';
import { cn } from '@/lib/cn';

const cols = [
  { key: 'kind', label: 'Tur' },
  { key: 'subject', label: 'Fan' },
  { key: 'place', label: 'Guruh / Oqim' },
  { key: 'students', label: 'Talabalar' },
  { key: 'coefficient', label: 'Koeffitsient' },
  { key: 'hours', label: 'Soatlar' },
  { key: 'category', label: 'Kategoriya' },
] as const;

/** Colour per workload kind for the "Tur" pill (matches design screenshots). */
const KIND_TONE: Record<WorkloadKind, string> = {
  lecture: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
  practice: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  control: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  individual_project:
    'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
  vqr_day: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
  vqr_parttime: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
  internship: 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200',
  prediploma: 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200',
  scientific_pedagogical:
    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  scientific_internship:
    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  phd_supervision_parttime:
    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  phd_supervision_fulltime:
    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
};

export function WorkloadTable({
  rows,
  emptyMessage = "Mos yuklama topilmadi — filtrlarni yumshating yoki yangisini biriktiring.",
}: {
  rows: WorkloadAssignment[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
        <p className="text-sm font-medium text-zinc-600">Ma'lumot yo'q</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-card">
      <div className="max-h-[min(60vh,560px)] overflow-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50/95 shadow-[0_1px_0_0_rgba(228,228,231,0.9)] backdrop-blur">
            <tr>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-zinc-100 transition hover:bg-zinc-50/80"
              >
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      KIND_TONE[r.kind],
                    )}
                  >
                    {KIND_SHORT_LABEL[r.kind]}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {r.subjectName || '—'}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {r.groupOrStreamLabel || '—'}
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-800">
                  {r.students}
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-600">
                  {r.coefficient && r.coefficient !== 1
                    ? r.coefficient
                    : '—'}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 font-semibold tabular-nums',
                    r.hours < 0 ? 'text-rose-600' : 'text-zinc-900',
                  )}
                >
                  {Number(r.hours.toFixed(1))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      r.category === 'auditorium'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-orange-50 text-orange-800',
                    )}
                  >
                    {r.category === 'auditorium' ? 'Auditoriya' : 'Tashqari'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
