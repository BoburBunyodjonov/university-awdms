import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AssignmentModal } from '@/components/AssignmentModal';
import { useWorkloadState, teacherStats } from '@/state/WorkloadState';
import { cn } from '@/lib/cn';
import type { Degree, Teacher } from '@/types';
import { DEGREE_LABEL } from '@/types';

type DegreeFilter = Degree | 'all';

export function TeachersPage() {
  const { teachers, assignments } = useWorkloadState();
  const [modalTeacher, setModalTeacher] = useState<Teacher | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [degree, setDegree] = useState<DegreeFilter>('all');

  const visible = useMemo(
    () =>
      teachers.filter((t) => (degree === 'all' ? true : t.degree === degree)),
    [teachers, degree],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            O'qituvchilar ro'yxati
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kafedrada jami{' '}
            <span className="font-semibold text-zinc-800">{teachers.length}</span>{' '}
            o'qituvchi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={degree}
            onChange={(e) => setDegree(e.target.value as DegreeFilter)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm"
          >
            <option value="all">Barcha darajalar</option>
            <option value="PhD">PhD</option>
            <option value="Magistr">Magistr</option>
            <option value="NoDegree">Daraja yo'q</option>
          </select>
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4" />
            + Yuklama tayinlash
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-card">
        <div className="max-h-[min(70vh,640px)] overflow-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 backdrop-blur">
              <tr>
                <th className="px-4 py-3">O'qituvchi</th>
                <th className="px-4 py-3">Ilmiy daraja</th>
                <th className="px-4 py-3">Jami / Norm</th>
                <th className="px-4 py-3">Auditoriya</th>
                <th className="px-4 py-3">Tashqari</th>
                <th className="px-4 py-3">Qolgan</th>
                <th className="px-4 py-3">Bajarilish</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    O'qituvchilar topilmadi.
                  </td>
                </tr>
              ) : (
                visible.map((t) => {
                  const s = teacherStats(t.id, assignments);
                  const rem = t.annualNorm - s.total;
                  const progress = Math.min(
                    100,
                    Math.round((s.total / t.annualNorm) * 100),
                  );
                  const initials = t.name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  return (
                    <tr
                      key={t.id}
                      className="border-t border-zinc-100 transition hover:bg-zinc-50/80"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">
                              {t.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {t.position}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            t.degree === 'PhD'
                              ? 'bg-violet-100 text-violet-800'
                              : 'bg-zinc-100 text-zinc-700',
                          )}
                        >
                          {DEGREE_LABEL[t.degree]}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-semibold text-zinc-900">
                          {s.total.toFixed(0)}
                        </span>
                        <span className="text-zinc-400"> / {t.annualNorm}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {s.auditorium.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {s.nonAuditorium.toFixed(0)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 font-medium tabular-nums',
                          rem < 0 ? 'text-rose-600' : 'text-amber-700',
                        )}
                      >
                        {rem.toFixed(0)} soat
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className={cn(
                                'h-full',
                                progress >= 100
                                  ? 'bg-emerald-500'
                                  : progress >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-400',
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-zinc-700">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Link
                            to={`/teachers/${t.id}`}
                            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                          >
                            Profil
                          </Link>
                          <button
                            type="button"
                            onClick={() => setModalTeacher(t)}
                            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            Tayinlash
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalTeacher ? (
        <AssignmentModal
          open
          teacher={modalTeacher}
          onClose={() => setModalTeacher(null)}
        />
      ) : null}
      {assignOpen ? (
        <AssignmentModal open onClose={() => setAssignOpen(false)} />
      ) : null}
    </div>
  );
}
