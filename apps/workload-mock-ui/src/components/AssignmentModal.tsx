import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Teacher, WorkloadAssignment, WorkloadKind } from '@/types';
import {
  isMax3StudentsKind,
  isPhdOnlyKind,
  KIND_LABEL,
} from '@/types';
import { FormField } from '@/components/FormField';
import { ValidationMessage } from '@/components/ValidationMessage';
import { useWorkloadState } from '@/state/WorkloadState';

type GroupConflict = 'duplicate' | 'practice_split' | null;

function checkGroupUsage(
  teacherId: string,
  NewGroupIds: string[],
  kind: WorkloadKind,
  list: WorkloadAssignment[],
): GroupConflict {
  if (NewGroupIds.length === 0) return null;

  if (kind === 'individual_project') {
    for (const a of list) {
      if (a.kind !== 'individual_project') continue;
      for (const g of NewGroupIds) {
        if ((a.groupIds ?? []).includes(g)) {
          return 'duplicate';
        }
      }
    }
  }

  for (const a of list) {
    if (a.teacherId !== teacherId) continue;
    const other = a.groupIds ?? [];
    for (const g of NewGroupIds) {
      if (!other.includes(g)) continue;
      if (kind === 'practice' && a.kind === 'practice') {
        return 'practice_split';
      }
      if (kind === a.kind) {
        return 'duplicate';
      }
      if (
        ['individual_project', 'internship', 'prediploma'].includes(kind) &&
        ['individual_project', 'internship', 'prediploma'].includes(a.kind)
      ) {
        return 'duplicate';
      }
    }
  }
  return null;
}

const ARENA: WorkloadKind[] = [
  'lecture',
  'practice',
  'control',
  'individual_project',
];
const NON: WorkloadKind[] = [
  'vqr_day',
  'vqr_parttime',
  'internship',
  'prediploma',
  'scientific_pedagogical',
  'scientific_internship',
  'phd_supervision_parttime',
  'phd_supervision_fulltime',
];

export function AssignmentModal({
  open,
  onClose,
  teacher,
  initialKind = 'lecture',
}: {
  open: boolean;
  onClose: () => void;
  teacher: Teacher;
  initialKind?: WorkloadKind;
}) {
  const { subjects, groups, streams, assignments, addAssignment } =
    useWorkloadState();

  const [kind, setKind] = useState<WorkloadKind>(initialKind);
  const [semester, setSemester] = useState<'fall' | 'spring'>('fall');
  const [subjectId, setSubjectId] = useState(() => subjects[0]?.id ?? '');

  const [lectureMode, setLectureMode] = useState<'stream' | 'group'>('stream');
  const [streamId, setStreamId] = useState(() => streams[0]?.id ?? '');
  const [lectureGroupId, setLectureGroupId] = useState(() => groups[0]?.id ?? '');
  const [lectureFixed, setLectureFixed] = useState(32);

  const [prGroupIds, setPrGroupIds] = useState<string[]>(() =>
    groups[0]?.id ? [groups[0].id] : [],
  );
  const [prFixed, setPrFixed] = useState(12);

  const [cStud, setCStud] = useState(30);
  const [cCoef, setCCoef] = useState(0.5);

  const [iGroupId, setIGroupId] = useState(() => groups[0]?.id ?? '');
  const [iStud, setIStud] = useState(8);
  const [iCoef, setICoef] = useState(0.5);

  const [vStud, setVStud] = useState(1);
  const [vCoef, setVCoef] = useState(40);

  const [ipGroupId, setIpGroupId] = useState(() => groups[0]?.id ?? '');
  const [ipStud, setIpStud] = useState(20);
  const [ipFixed, setIpFixed] = useState(1.2);

  const [pStud, setPStud] = useState(2);
  const [pCoef, setPCoef] = useState(100);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setSubmitting(false);
  }, [open, initialKind]);

  const preview = useMemo(() => {
    switch (kind) {
      case 'lecture': {
        const h = Math.max(0, lectureFixed);
        return { hours: h, text: `Total = ${h}h fixed` };
      }
      case 'practice': {
        const n = prGroupIds.length;
        const h = prFixed * n;
        return {
          hours: h,
          text: `Total = ${prFixed}h × ${n} group(s) = ${h.toFixed(1)}h`,
        };
      }
      case 'control': {
        const h = cStud * cCoef;
        return {
          hours: h,
          text: `${cStud} students × ${cCoef} coefficient = ${h.toFixed(1)}h`,
        };
      }
      case 'individual_project': {
        const h = iStud * 1 * iCoef;
        return {
          hours: h,
          text: `${iStud} students × 1 group × ${iCoef} = ${h.toFixed(1)}h`,
        };
      }
      case 'vqr_day':
      case 'vqr_parttime': {
        const h = vStud * vCoef;
        return { hours: h, text: `${vStud} students × ${vCoef} = ${h}h` };
      }
      case 'internship':
      case 'prediploma': {
        const h = ipStud * ipFixed;
        return {
          hours: h,
          text: `${ipStud} students × ${ipFixed} fixed value = ${h.toFixed(1)}h`,
        };
      }
      case 'scientific_pedagogical':
      case 'scientific_internship':
      case 'phd_supervision_parttime':
      case 'phd_supervision_fulltime': {
        const h = pStud * pCoef;
        return { hours: h, text: `${pStud} students × ${pCoef} = ${h}h` };
      }
      default: {
        return { hours: 0, text: '—' };
      }
    }
  }, [
    kind,
    lectureFixed,
    prGroupIds.length,
    prFixed,
    cStud,
    cCoef,
    iStud,
    iCoef,
    vStud,
    vCoef,
    ipStud,
    ipFixed,
    pStud,
    pCoef,
  ]);

  const subjectName =
    subjects.find((s) => s.id === subjectId)?.name ?? '—';

  const vErrors: { code: string; message: string }[] = useMemo(() => {
    const out: { code: string; message: string }[] = [];
    if (isPhdOnlyKind(kind) && teacher.degree !== 'PhD') {
      out.push({ code: 'phd', message: 'Only PhD allowed.' });
    }
    if (isMax3StudentsKind(kind) && pStud > 3) {
      out.push({ code: 'm3', message: 'Max 3 students allowed.' });
    }
    if (isMax3StudentsKind(kind) && pStud < 1) {
      out.push({ code: 'm3b', message: 'At least 1 PhD / supervision slot required.' });
    }
    if (kind === 'practice' && prGroupIds.length === 0) {
      out.push({ code: 'prg', message: 'Select at least one group for practice.' });
    }

    let gids: string[] = [];
    if (kind === 'lecture' && lectureMode === 'group') gids = [lectureGroupId];
    if (kind === 'practice') gids = prGroupIds;
    if (kind === 'individual_project') gids = [iGroupId];
    if (kind === 'internship' || kind === 'prediploma') gids = [ipGroupId];

    const conflict = checkGroupUsage(teacher.id, gids, kind, assignments);
    if (conflict === 'duplicate') {
      out.push({
        code: 'gdup',
        message: 'This group already assigned.',
      });
    }
    if (conflict === 'practice_split') {
      out.push({
        code: 'psplit',
        message: 'Practice cannot be split.',
      });
    }

    if (Number.isNaN(preview.hours) || !Number.isFinite(preview.hours)) {
      out.push({ code: 'num', message: 'Invalid numeric values.' });
    }
    return out;
  }, [
    kind,
    teacher,
    prGroupIds,
    lectureGroupId,
    lectureMode,
    iGroupId,
    ipGroupId,
    assignments,
    preview.hours,
    pStud,
  ]);

  const isValid = vErrors.length === 0;
  const errorField = (code: string) => vErrors.some((e) => e.code === code);

  if (!open) return null;

  function buildRow(): Omit<WorkloadAssignment, 'id' | 'category' | 'isAuditorium'> {
    const base = {
      teacherId: teacher.id,
      kind,
      semester,
      subjectId,
      subjectName,
    };

    if (kind === 'lecture') {
      if (lectureMode === 'stream') {
        const st = streams.find((s) => s.id === streamId);
        return {
          ...base,
          groupOrStreamLabel: st?.name ?? 'Stream',
          students: st?.studentCount ?? 0,
          coefficient: 1,
          hours: lectureFixed,
          groupIds: [],
        };
      }
      const g = groups.find((x) => x.id === lectureGroupId);
      return {
        ...base,
        groupOrStreamLabel: g?.name ?? 'Group',
        students: g?.studentCount ?? 0,
        coefficient: 1,
        hours: lectureFixed,
        groupIds: [lectureGroupId],
      };
    }
    if (kind === 'practice') {
      const names = prGroupIds
        .map((id) => groups.find((g) => g.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      const studs = prGroupIds.reduce(
        (s, id) => s + (groups.find((g) => g.id === id)?.studentCount ?? 0),
        0,
      );
      return {
        ...base,
        groupOrStreamLabel: names,
        students: studs,
        coefficient: 1,
        hours: prFixed * prGroupIds.length,
        groupIds: prGroupIds,
      };
    }
    if (kind === 'control') {
      return {
        ...base,
        groupOrStreamLabel: 'Assessment',
        students: cStud,
        coefficient: cCoef,
        hours: cStud * cCoef,
        groupIds: [],
      };
    }
    if (kind === 'individual_project') {
      return {
        ...base,
        groupOrStreamLabel: groups.find((g) => g.id === iGroupId)?.name ?? 'Group',
        students: iStud,
        coefficient: iCoef,
        hours: iStud * iCoef,
        groupIds: [iGroupId],
      };
    }
    if (kind === 'vqr_day' || kind === 'vqr_parttime') {
      return {
        ...base,
        groupOrStreamLabel: 'VQR',
        students: vStud,
        coefficient: vCoef,
        hours: vStud * vCoef,
        groupIds: [],
      };
    }
    if (kind === 'internship' || kind === 'prediploma') {
      return {
        ...base,
        groupOrStreamLabel: groups.find((g) => g.id === ipGroupId)?.name ?? '—',
        students: ipStud,
        coefficient: ipFixed,
        hours: ipStud * ipFixed,
        groupIds: [ipGroupId],
      };
    }
    return {
      ...base,
      groupOrStreamLabel: 'PhD / supervision',
      students: pStud,
      coefficient: pCoef,
      hours: pStud * pCoef,
      groupIds: [],
    };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    window.setTimeout(() => {
      addAssignment(buildRow());
      setSubmitting(false);
      onClose();
    }, 420);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-zinc-200/80 bg-white shadow-2xl sm:rounded-3xl">
        <header className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Assign workload</h2>
            <p className="text-xs text-zinc-500">{teacher.name} · {subjectName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Semester">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as 'fall' | 'spring')}
                className="h-10 w-full rounded-lg border-0 bg-transparent px-3 text-sm outline-none"
              >
                <option value="fall">Fall</option>
                <option value="spring">Spring</option>
              </select>
            </FormField>
            <FormField label="Subject">
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-10 w-full rounded-lg border-0 bg-transparent px-3 text-sm outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase text-zinc-500">
              Workload type
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Auditorium</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {ARENA.map((w) => (
                    <TypeChip
                      key={w}
                      workKind={w}
                      active={kind === w}
                      onSelect={() => setKind(w)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Non-auditorium</p>
                <div className="mt-1 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {NON.map((w) => (
                    <TypeChip
                      key={w}
                      workKind={w}
                      active={kind === w}
                      onSelect={() => setKind(w)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {isPhdOnlyKind(kind) && teacher.degree !== 'PhD' ? (
            <ValidationMessage tone="warning" title="PhD only">
              Only PhD teachers can receive this workload type. Submission is
              blocked until you pick a PhD teacher or another type.
            </ValidationMessage>
          ) : null}

          {kind === 'lecture' && (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
              <div className="flex gap-2">
                {(['stream', 'group'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setLectureMode(m)}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-sm font-medium',
                      lectureMode === m
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-700 ring-1 ring-zinc-200',
                    )}
                  >
                    {m === 'stream' ? 'Stream' : 'Group'}
                  </button>
                ))}
              </div>
              {lectureMode === 'stream' ? (
                <label>
                  <span className="text-[10px] font-semibold uppercase text-zinc-500">
                    Stream
                  </span>
                  <select
                    value={streamId}
                    onChange={(e) => setStreamId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                  >
                    {streams.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span className="text-[10px] font-semibold uppercase text-zinc-500">
                    Group
                  </span>
                  <select
                    value={lectureGroupId}
                    onChange={(e) => setLectureGroupId(e.target.value)}
                    className={cn(
                      'mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm',
                      errorField('gdup') ? 'border-red-400' : 'border-zinc-200',
                    )}
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} · {g.language.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <span className="text-[10px] font-semibold uppercase text-zinc-500">
                  Fixed hours
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={lectureFixed}
                  onChange={(e) => setLectureFixed(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                />
                <p className="mt-1 text-xs text-zinc-500">Formula: Total = fixed</p>
              </label>
            </div>
          )}

          {kind === 'practice' && (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
              <p className="text-xs text-zinc-600">
                Select one or more groups — total hours = fixed × group count. Practice
                cannot be split across duplicate rows for the same group.
              </p>
              <FormField
                label="Groups (multi-select)"
                error={
                  errorField('gdup') ||
                  errorField('psplit') ||
                  errorField('prg')
                }
                hint="Same group cannot appear twice for practice on this teacher."
              >
                <div className="max-h-36 space-y-1 overflow-y-auto p-2">
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={prGroupIds.includes(g.id)}
                        onChange={() => {
                          setPrGroupIds((prev) =>
                            prev.includes(g.id)
                              ? prev.filter((x) => x !== g.id)
                              : [...prev, g.id],
                          );
                        }}
                      />
                      <span className="text-sm">
                        {g.name} <span className="text-zinc-400">({g.language})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </FormField>
              <FormField
                label="Fixed hours (per group)"
                error={errorField('psplit') || errorField('prg')}
              >
                <input
                  type="number"
                  value={prFixed}
                  onChange={(e) => setPrFixed(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border-0 bg-transparent px-3 text-sm outline-none"
                />
              </FormField>
            </div>
          )}

          {kind === 'control' && (
            <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 sm:grid-cols-2">
              <label>
                <span className="text-[10px] font-semibold uppercase text-zinc-500">
                  Student count
                </span>
                <input
                  type="number"
                  value={cStud}
                  onChange={(e) => setCStud(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                />
              </label>
              <label>
                <span className="text-[10px] font-semibold uppercase text-zinc-500">
                  Coefficient
                </span>
                <input
                  type="number"
                  step={0.1}
                  value={cCoef}
                  onChange={(e) => setCCoef(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                />
              </label>
            </div>
          )}

          {kind === 'individual_project' && (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
              <label>
                <span className="text-[10px] font-semibold uppercase text-zinc-500">
                  Group
                </span>
                <select
                  value={iGroupId}
                  onChange={(e) => setIGroupId(e.target.value)}
                    className={cn(
                      'mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm',
                      errorField('gdup') ? 'border-red-400' : 'border-zinc-200',
                    )}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-[10px] font-semibold uppercase text-zinc-500">
                    Students
                  </span>
                  <input
                    type="number"
                    value={iStud}
                    onChange={(e) => setIStud(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-semibold uppercase text-zinc-500">
                    Coefficient
                  </span>
                  <input
                    type="number"
                    step={0.1}
                    value={iCoef}
                    onChange={(e) => setICoef(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                  />
                </label>
              </div>
            </div>
          )}

          {(kind === 'vqr_day' || kind === 'vqr_parttime') && (
            <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 sm:grid-cols-2">
              <label>
                <span className="text-[10px] font-semibold uppercase text-zinc-500">
                  Student count
                </span>
                <input
                  type="number"
                  value={vStud}
                  onChange={(e) => setVStud(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                />
              </label>
              <label>
                <span className="text-[10px] font-semibold uppercase text-zinc-500">
                  Coefficient
                </span>
                <input
                  type="number"
                  value={vCoef}
                  onChange={(e) => setVCoef(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                />
              </label>
            </div>
          )}

          {(kind === 'internship' || kind === 'prediploma') && (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
              <label>
                <span className="text-[10px] font-semibold uppercase text-zinc-500">
                  Group
                </span>
                <select
                  value={ipGroupId}
                  onChange={(e) => setIpGroupId(e.target.value)}
                  className={cn(
                    'mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm',
                    errorField('gdup') ? 'border-red-400' : 'border-zinc-200',
                  )}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-[10px] font-semibold uppercase text-zinc-500">
                    Student count
                  </span>
                  <input
                    type="number"
                    value={ipStud}
                    onChange={(e) => setIpStud(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-semibold uppercase text-zinc-500">
                    Fixed value (h per student)
                  </span>
                  <input
                    type="number"
                    step={0.1}
                    value={ipFixed}
                    onChange={(e) => setIpFixed(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                  />
                </label>
              </div>
            </div>
          )}

          {isMax3StudentsKind(kind) && (
            <div className="grid gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 sm:grid-cols-2">
              <label>
                <span className="text-[10px] font-semibold uppercase text-amber-800/90">
                  Student / advisee count
                </span>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={pStud}
                  onChange={(e) => setPStud(Number(e.target.value))}
                  className={cn(
                    'mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm',
                    pStud > 3 || errorField('m3') ? 'border-red-500' : 'border-amber-200',
                  )}
                />
                <p className="mt-1 text-xs text-amber-800/80">Max 3 (PhD rules)</p>
              </label>
              <label>
                <span className="text-[10px] font-semibold uppercase text-amber-800/90">
                  Coefficient
                </span>
                <input
                  type="number"
                  value={pCoef}
                  onChange={(e) => setPCoef(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm"
                />
              </label>
            </div>
          )}
          </div>

          <div className="shrink-0 space-y-3 border-t border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          {vErrors.length > 0 && (
            <div className="space-y-1.5">
              {vErrors.map((e) => (
                <ValidationMessage key={e.code} tone="error" title="Cannot assign">
                  {e.message}
                </ValidationMessage>
              ))}
            </div>
          )}

          <div
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-4',
              isValid
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-rose-200 bg-rose-50/50',
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                isValid ? 'bg-emerald-600 text-white' : 'bg-rose-200 text-rose-800',
              )}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Live formula preview
              </p>
              <p className="mt-1 break-words font-mono text-sm text-zinc-900">
                {preview.text}
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {preview.hours.toFixed(1)}{' '}
                <span className="text-base font-medium text-zinc-500">hours</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-11 flex-1 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition',
                isValid && !submitting
                  ? 'bg-zinc-900 hover:bg-zinc-800'
                  : 'cursor-not-allowed bg-zinc-300',
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Add assignment'
              )}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TypeChip({
  workKind,
  active,
  onSelect,
}: {
  workKind: WorkloadKind;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium',
        active
          ? 'border-zinc-900 bg-zinc-900 text-white'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300',
      )}
    >
      {KIND_LABEL[workKind]}
    </button>
  );
}
