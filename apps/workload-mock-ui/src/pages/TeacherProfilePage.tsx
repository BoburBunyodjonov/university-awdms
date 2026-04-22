import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, UserPlus } from 'lucide-react';
import { AssignmentModal } from '@/components/AssignmentModal';
import { FiltersPanel } from '@/components/FiltersPanel';
import { SummaryCards } from '@/components/SummaryCards';
import { WorkloadTable } from '@/components/WorkloadTable';
import { getTeacherById } from '@/mock/data';
import { teacherStats, useWorkloadState } from '@/state/WorkloadState';
import type { SemesterFilter, WorkloadCategory, WorkloadKind } from '@/types';
import { DEGREE_LABEL } from '@/types';
import { cn } from '@/lib/cn';
import { ValidationMessage } from '@/components/ValidationMessage';

export function TeacherProfilePage() {
  const { id } = useParams();
  const teacher = useMemo(() => getTeacherById(id ?? ''), [id]);
  const { assignments } = useWorkloadState();
  const [modalOpen, setModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [semester, setSemester] = useState<SemesterFilter>('all');
  const [type, setType] = useState<WorkloadKind | 'all'>('all');
  const [category, setCategory] = useState<WorkloadCategory | 'all'>('all');

  const mine = useMemo(
    () => assignments.filter((a) => a.teacherId === id),
    [assignments, id],
  );

  const filtered = useMemo(() => {
    return mine.filter((a) => {
      if (semester !== 'all' && a.semester !== semester) return false;
      if (type !== 'all' && a.kind !== type) return false;
      if (category !== 'all' && a.category !== category) return false;
      return true;
    });
  }, [mine, semester, type, category]);

  const stats = teacher ? teacherStats(teacher.id, assignments) : null;
  const total = stats?.total ?? 0;
  const remaining = teacher ? teacher.annualNorm - total : 0;
  const progress = teacher
    ? Math.min(100, Math.round((total / teacher.annualNorm) * 100))
    : 0;

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      window.alert('Excel eksport (mock): fayl shu yerda yuklanib olinadi.');
    }, 900);
  }

  if (!teacher) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        O'qituvchi topilmadi.
        <Link to="/teachers" className="ml-2 underline">
          Ro'yxatga qaytish
        </Link>
      </div>
    );
  }

  const initials = teacher.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/teachers"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          O'qituvchilar ro'yxatiga qaytish
        </Link>

        <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-zinc-900">
                  {teacher.name}
                </h1>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    teacher.degree === 'PhD'
                      ? 'bg-violet-100 text-violet-800'
                      : 'bg-zinc-100 text-zinc-700',
                  )}
                >
                  {DEGREE_LABEL[teacher.degree]}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">{teacher.position}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-500">
                  Normani bajarish:
                </span>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      progress >= 100
                        ? 'bg-emerald-500'
                        : progress >= 70
                        ? 'bg-amber-500'
                        : 'bg-indigo-500',
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-zinc-700">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Excel eksport
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4" />
              + Yuklama tayinlash
            </button>
          </div>
        </div>
      </div>

      {remaining < 0 ? (
        <ValidationMessage tone="warning" title="Normadan oshgan">
          Bu o'qituvchi yillik normadan{' '}
          {Math.abs(remaining).toFixed(0)} soatga oshib ketgan — biriktirishlarni tekshiring.
        </ValidationMessage>
      ) : null}

      <SummaryCards
        items={[
          {
            label: 'Jami soat',
            value: `${total.toFixed(0)}`,
            hint: `/ ${teacher.annualNorm} norm`,
            variant: 'indigo',
          },
          {
            label: 'Auditoriya',
            value: `${(stats?.auditorium ?? 0).toFixed(0)}`,
            hint: 'soat',
            variant: 'emerald',
          },
          {
            label: 'Tashqari',
            value: `${(stats?.nonAuditorium ?? 0).toFixed(0)}`,
            hint: 'soat',
            variant: 'amber',
          },
          {
            label: 'Qolgan norm',
            value: `${remaining.toFixed(0)}`,
            hint: 'soat',
            variant: remaining < 0 ? 'rose' : 'default',
          },
        ]}
      />

      <FiltersPanel
        semester={semester}
        onSemester={setSemester}
        type={type}
        onType={setType}
        category={category}
        onCategory={setCategory}
      />

      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Yuklama jadvali</h2>
        <p className="text-xs text-zinc-500">
          Jadval sarlavhasi yopishqoq — kichik ekranlarda gorizontal skroll.
        </p>
        <div className="mt-3">
          <WorkloadTable rows={filtered} />
        </div>
      </div>

      {modalOpen ? (
        <AssignmentModal
          open
          teacher={teacher}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
