import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Teacher, WorkloadAssignment, WorkloadKind } from '@/types';
import {
  DEGREE_LABEL,
  KIND_LABEL,
  isMax3StudentsKind,
  isPhd,
  isPhdOnlyKind,
} from '@/types';
import { FormField } from '@/components/FormField';
import { ValidationMessage } from '@/components/ValidationMessage';
import { teacherStats, useWorkloadState } from '@/state/WorkloadState';

/**
 * Assignment modal ("Yuklama tayinlash") — single categorised select for
 * workload type, dynamic fields per kind and a live formula preview.
 *
 * Matches TZ §4.5.1 formulas:
 *   - Lecture:            fixedHours
 *   - Practice:           fixedHours × groupCount
 *   - Control:            studentCount × coefficient
 *   - Individual project: studentCount × groupCount × coefficient
 *   - VQR / PhD work:     studentCount × coefficient (PhD only, max 3)
 *   - Internship / Pre-diploma: studentCount × fixedValue
 */

type GroupConflict = 'duplicate' | 'practice_split' | null;

function checkGroupUsage(
  teacherId: string,
  newGroupIds: string[],
  kind: WorkloadKind,
  list: WorkloadAssignment[],
): GroupConflict {
  if (newGroupIds.length === 0) return null;

  if (kind === 'individual_project') {
    for (const a of list) {
      if (a.kind !== 'individual_project') continue;
      for (const g of newGroupIds) {
        if ((a.groupIds ?? []).includes(g)) return 'duplicate';
      }
    }
  }

  for (const a of list) {
    if (a.teacherId !== teacherId) continue;
    const other = a.groupIds ?? [];
    for (const g of newGroupIds) {
      if (!other.includes(g)) continue;
      if (kind === 'practice' && a.kind === 'practice') return 'practice_split';
      if (kind === a.kind) return 'duplicate';
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

const AUDITORIUM_KINDS: WorkloadKind[] = [
  'lecture',
  'practice',
  'control',
  'individual_project',
];

const NON_AUDITORIUM_KINDS: WorkloadKind[] = [
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
  teacher: teacherProp,
  initialKind = 'lecture',
}: {
  open: boolean;
  onClose: () => void;
  /** If provided, the teacher selector is locked to that teacher. */
  teacher?: Teacher;
  initialKind?: WorkloadKind;
}) {
  const { teachers, subjects, groups, streams, assignments, addAssignment } =
    useWorkloadState();

  const [teacherId, setTeacherId] = useState<string>(
    () => teacherProp?.id ?? teachers[0]?.id ?? '',
  );
  const teacher =
    teachers.find((t) => t.id === teacherId) ?? teacherProp ?? teachers[0];

  const [kind, setKind] = useState<WorkloadKind>(initialKind);
  const [semester, setSemester] = useState<'fall' | 'spring'>('fall');
  const [subjectId, setSubjectId] = useState(() => subjects[0]?.id ?? '');

  const [lectureMode, setLectureMode] = useState<'stream' | 'group'>('stream');
  const [streamId, setStreamId] = useState(() => streams[0]?.id ?? '');
  const [lectureGroupId, setLectureGroupId] = useState(
    () => groups[0]?.id ?? '',
  );
  const [lectureFixed, setLectureFixed] = useState(54);

  const [prGroupIds, setPrGroupIds] = useState<string[]>(() =>
    groups[0]?.id ? [groups[0].id] : [],
  );
  const [prFixed, setPrFixed] = useState(36);

  const [cStud, setCStud] = useState(25);
  const [cCoef, setCCoef] = useState(0.72);

  const [ipGroupIds, setIpGroupIds] = useState<string[]>(() =>
    groups[0]?.id ? [groups[0].id] : [],
  );
  const [ipStud, setIpStud] = useState(18);
  const [ipCoef, setIpCoef] = useState(0.4);

  const [vStud, setVStud] = useState(20);
  const [vCoef, setVCoef] = useState(1.5);

  const [intGroupId, setIntGroupId] = useState(() => groups[0]?.id ?? '');
  const [intStud, setIntStud] = useState(15);
  const [intFixed, setIntFixed] = useState(1.47);

  const [pStud, setPStud] = useState(2);
  const [pCoef, setPCoef] = useState(150);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setSubmitting(false);
    if (teacherProp?.id) setTeacherId(teacherProp.id);
  }, [open, initialKind, teacherProp?.id]);

  const preview = useMemo(() => {
    switch (kind) {
      case 'lecture': {
        const h = Math.max(0, lectureFixed);
        return {
          hours: h,
          text: `${h} soat (qat'iy)`,
        };
      }
      case 'practice': {
        const n = prGroupIds.length;
        const h = prFixed * n;
        return {
          hours: h,
          text: `${prFixed} soat × ${n} guruh`,
        };
      }
      case 'control': {
        const h = cStud * cCoef;
        return {
          hours: h,
          text: `${cStud} talaba × ${cCoef}`,
        };
      }
      case 'individual_project': {
        const n = Math.max(1, ipGroupIds.length);
        const h = ipStud * n * ipCoef;
        return {
          hours: h,
          text: `${ipStud} talaba × ${n} guruh × ${ipCoef}`,
        };
      }
      case 'vqr_day':
      case 'vqr_parttime': {
        const h = vStud * vCoef;
        return { hours: h, text: `${vStud} talaba × ${vCoef}` };
      }
      case 'internship':
      case 'prediploma': {
        const h = intStud * intFixed;
        return {
          hours: h,
          text: `${intStud} talaba × ${intFixed}`,
        };
      }
      case 'scientific_pedagogical':
      case 'scientific_internship':
      case 'phd_supervision_parttime':
      case 'phd_supervision_fulltime': {
        const h = pStud * pCoef;
        return { hours: h, text: `${pStud} talaba × ${pCoef}` };
      }
      default:
        return { hours: 0, text: '—' };
    }
  }, [
    kind,
    lectureFixed,
    prGroupIds.length,
    prFixed,
    cStud,
    cCoef,
    ipGroupIds.length,
    ipStud,
    ipCoef,
    vStud,
    vCoef,
    intStud,
    intFixed,
    pStud,
    pCoef,
  ]);

  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? '—';
  const stats = teacher ? teacherStats(teacher.id, assignments) : null;
  const remaining = teacher ? teacher.annualNorm - (stats?.total ?? 0) : 0;

  const vErrors: { code: string; message: string }[] = useMemo(() => {
    const out: { code: string; message: string }[] = [];
    if (!teacher) return out;

    if (isPhdOnlyKind(kind) && !isPhd(teacher.degree)) {
      out.push({
        code: 'phd',
        message: 'Faqat PhD ilmiy darajasiga ega o‘qituvchilar uchun.',
      });
    }
    if (isMax3StudentsKind(kind) && pStud > 3) {
      out.push({ code: 'm3', message: 'Maksimum 3 ta talaba (PhD qoidasi).' });
    }
    if (isMax3StudentsKind(kind) && pStud < 1) {
      out.push({
        code: 'm3b',
        message: 'Kamida 1 ta talaba bo‘lishi shart.',
      });
    }
    if (kind === 'practice' && prGroupIds.length === 0) {
      out.push({
        code: 'prg',
        message: 'Amaliyot uchun kamida bitta guruh tanlang.',
      });
    }
    if (kind === 'individual_project' && ipGroupIds.length === 0) {
      out.push({
        code: 'ipg',
        message: 'Individual loyiha uchun guruh tanlang.',
      });
    }

    let gids: string[] = [];
    if (kind === 'lecture' && lectureMode === 'group') gids = [lectureGroupId];
    if (kind === 'practice') gids = prGroupIds;
    if (kind === 'individual_project') gids = ipGroupIds;
    if (kind === 'internship' || kind === 'prediploma') gids = [intGroupId];

    const conflict = checkGroupUsage(teacher.id, gids, kind, assignments);
    if (conflict === 'duplicate') {
      out.push({
        code: 'gdup',
        message: 'Bu guruh ushbu yuklama turida allaqachon biriktirilgan.',
      });
    }
    if (conflict === 'practice_split') {
      out.push({
        code: 'psplit',
        message: 'Amaliyot bir necha o‘qituvchiga bo‘linishi mumkin emas.',
      });
    }

    if (Number.isNaN(preview.hours) || !Number.isFinite(preview.hours)) {
      out.push({ code: 'num', message: 'Son qiymatlar noto‘g‘ri.' });
    }
    return out;
  }, [
    kind,
    teacher,
    prGroupIds,
    ipGroupIds,
    lectureGroupId,
    lectureMode,
    intGroupId,
    assignments,
    preview.hours,
    pStud,
  ]);

  const isValid = vErrors.length === 0;
  const errorField = (code: string) => vErrors.some((e) => e.code === code);

  if (!open || !teacher) return null;

  function buildRow(): Omit<
    WorkloadAssignment,
    'id' | 'category' | 'isAuditorium'
  > {
    const base = {
      teacherId: teacher!.id,
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
          groupOrStreamLabel: st?.name ?? 'Oqim',
          students: st?.studentCount ?? 0,
          coefficient: 1,
          hours: lectureFixed,
          groupIds: [],
        };
      }
      const g = groups.find((x) => x.id === lectureGroupId);
      return {
        ...base,
        groupOrStreamLabel: g?.name ?? 'Guruh',
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
        groupOrStreamLabel: '—',
        students: cStud,
        coefficient: cCoef,
        hours: cStud * cCoef,
        groupIds: [],
      };
    }

    if (kind === 'individual_project') {
      const names = ipGroupIds
        .map((id) => groups.find((g) => g.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return {
        ...base,
        groupOrStreamLabel: names || 'Guruh',
        students: ipStud,
        coefficient: ipCoef,
        hours: ipStud * Math.max(1, ipGroupIds.length) * ipCoef,
        groupIds: ipGroupIds,
      };
    }

    if (kind === 'vqr_day' || kind === 'vqr_parttime') {
      return {
        ...base,
        groupOrStreamLabel:
          kind === 'vqr_day' ? 'VQR (Kunduzgi)' : 'VQR (Sirtqi)',
        students: vStud,
        coefficient: vCoef,
        hours: vStud * vCoef,
        groupIds: [],
      };
    }

    if (kind === 'internship' || kind === 'prediploma') {
      return {
        ...base,
        groupOrStreamLabel:
          groups.find((g) => g.id === intGroupId)?.name ?? '—',
        students: intStud,
        coefficient: intFixed,
        hours: intStud * intFixed,
        groupIds: [intGroupId],
      };
    }

    return {
      ...base,
      groupOrStreamLabel: KIND_LABEL[kind],
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

  const teacherLocked = Boolean(teacherProp);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-zinc-200/80 bg-white shadow-2xl sm:rounded-3xl">
        <header className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900">
              Yuklama tayinlash
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <FormField label="O'qituvchi *">
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                disabled={teacherLocked}
                className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({DEGREE_LABEL[t.degree]})
                  </option>
                ))}
              </select>
            </FormField>

            <TeacherPreview
              teacher={teacher}
              remaining={remaining}
              phdOnly={isPhdOnlyKind(kind) && !isPhd(teacher.degree)}
            />

            <FormField
              label="Yuklama turi *"
              error={errorField('phd')}
              hint={
                isPhdOnlyKind(kind)
                  ? 'Faqat PhD: talabalar soni ≤ 3.'
                  : undefined
              }
            >
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as WorkloadKind)}
                className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
              >
                <optgroup label="— Auditoriya soatlari">
                  {AUDITORIUM_KINDS.map((w) => (
                    <option key={w} value={w}>
                      {KIND_LABEL[w]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="— Auditoriyadan tashqari">
                  {NON_AUDITORIUM_KINDS.map((w) => (
                    <option key={w} value={w}>
                      {KIND_LABEL[w]}
                    </option>
                  ))}
                </optgroup>
              </select>
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Semestr">
                <select
                  value={semester}
                  onChange={(e) =>
                    setSemester(e.target.value as 'fall' | 'spring')
                  }
                  className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                >
                  <option value="fall">1-semestr (Kuz)</option>
                  <option value="spring">2-semestr (Bahor)</option>
                </select>
              </FormField>
              {kind !== 'scientific_pedagogical' &&
                kind !== 'scientific_internship' &&
                kind !== 'phd_supervision_parttime' &&
                kind !== 'phd_supervision_fulltime' && (
                  <FormField label="Fan">
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}
            </div>

            {kind === 'lecture' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['stream', 'group'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLectureMode(m)}
                      className={cn(
                        'flex-1 rounded-lg py-2 text-sm font-medium transition',
                        lectureMode === m
                          ? 'bg-zinc-900 text-white'
                          : 'bg-white text-zinc-700 ring-1 ring-zinc-200',
                      )}
                    >
                      {m === 'stream' ? 'Oqim' : 'Guruh'}
                    </button>
                  ))}
                </div>
                {lectureMode === 'stream' ? (
                  <FormField label="Oqim (potok)">
                    <select
                      value={streamId}
                      onChange={(e) => setStreamId(e.target.value)}
                      className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                    >
                      {streams.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ) : (
                  <FormField label="Guruh" error={errorField('gdup')}>
                    <select
                      value={lectureGroupId}
                      onChange={(e) => setLectureGroupId(e.target.value)}
                      className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} · {g.language.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}
                <FormField
                  label="Qat'iy soat"
                  hint="Formula: jami = qat'iy soat"
                >
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={lectureFixed}
                    onChange={(e) => setLectureFixed(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  />
                </FormField>
              </div>
            )}

            {kind === 'practice' && (
              <div className="space-y-3">
                <FormField
                  label="Guruhlar (bir nechta tanlash mumkin)"
                  error={
                    errorField('gdup') ||
                    errorField('psplit') ||
                    errorField('prg')
                  }
                  hint="Bir guruh ikki marta biriktirilishi mumkin emas."
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
                          {g.name}{' '}
                          <span className="text-zinc-400">
                            ({g.language.toUpperCase()})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label="Qat'iy soat (har guruhga)">
                  <input
                    type="number"
                    min={0}
                    value={prFixed}
                    onChange={(e) => setPrFixed(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  />
                </FormField>
              </div>
            )}

            {kind === 'control' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Talabalar soni *">
                  <input
                    type="number"
                    min={1}
                    value={cStud}
                    onChange={(e) => setCStud(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  />
                </FormField>
                <FormField label="Koeffitsient">
                  <input
                    type="number"
                    step={0.01}
                    value={cCoef}
                    onChange={(e) => setCCoef(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  />
                </FormField>
              </div>
            )}

            {kind === 'individual_project' && (
              <div className="space-y-3">
                <FormField
                  label="Guruhlar (bir yoki bir nechta)"
                  error={errorField('gdup') || errorField('ipg')}
                  hint="Bir guruh faqat bitta o'qituvchiga biriktiriladi."
                >
                  <div className="max-h-36 space-y-1 overflow-y-auto p-2">
                    {groups.map((g) => (
                      <label
                        key={g.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-50"
                      >
                        <input
                          type="checkbox"
                          checked={ipGroupIds.includes(g.id)}
                          onChange={() => {
                            setIpGroupIds((prev) =>
                              prev.includes(g.id)
                                ? prev.filter((x) => x !== g.id)
                                : [...prev, g.id],
                            );
                          }}
                        />
                        <span className="text-sm">
                          {g.name}{' '}
                          <span className="text-zinc-400">
                            ({g.language.toUpperCase()})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Talabalar soni *">
                    <input
                      type="number"
                      min={1}
                      value={ipStud}
                      onChange={(e) => setIpStud(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                    />
                  </FormField>
                  <FormField label="Koeffitsient">
                    <input
                      type="number"
                      step={0.01}
                      value={ipCoef}
                      onChange={(e) => setIpCoef(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {(kind === 'vqr_day' || kind === 'vqr_parttime') && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Talabalar soni *">
                  <input
                    type="number"
                    min={1}
                    value={vStud}
                    onChange={(e) => setVStud(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  />
                </FormField>
                <FormField label="Koeffitsient">
                  <input
                    type="number"
                    step={0.1}
                    value={vCoef}
                    onChange={(e) => setVCoef(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  />
                </FormField>
              </div>
            )}

            {(kind === 'internship' || kind === 'prediploma') && (
              <div className="space-y-3">
                <FormField label="Guruh" error={errorField('gdup')}>
                  <select
                    value={intGroupId}
                    onChange={(e) => setIntGroupId(e.target.value)}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Talabalar soni *">
                    <input
                      type="number"
                      min={1}
                      value={intStud}
                      onChange={(e) => setIntStud(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                    />
                  </FormField>
                  <FormField label="Qat'iy qiymat (har talabaga)">
                    <input
                      type="number"
                      step={0.1}
                      value={intFixed}
                      onChange={(e) => setIntFixed(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {isMax3StudentsKind(kind) && (
              <div className="grid gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 sm:grid-cols-2">
                <FormField
                  label="Talabalar soni * (max 3)"
                  error={errorField('m3') || errorField('m3b')}
                >
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={pStud}
                    onChange={(e) => setPStud(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  />
                </FormField>
                <FormField label="Koeffitsient">
                  <input
                    type="number"
                    value={pCoef}
                    onChange={(e) => setPCoef(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
                  />
                </FormField>
              </div>
            )}

            <div
              className={cn(
                'rounded-2xl border p-4',
                isValid
                  ? 'border-indigo-200 bg-indigo-50/50'
                  : 'border-rose-200 bg-rose-50/50',
              )}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                Formula va hisoblash
              </p>
              <p className="mt-1 font-mono text-sm text-zinc-800">
                {preview.text}
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {preview.hours.toFixed(1)}
                <span className="ml-1 text-base font-medium text-zinc-500">
                  soat
                </span>
              </p>
            </div>

            {vErrors.length > 0 && (
              <div className="space-y-1.5">
                {vErrors.map((e) => (
                  <ValidationMessage
                    key={e.code}
                    tone="error"
                    title="Biriktirib bo‘lmaydi"
                  >
                    {e.message}
                  </ValidationMessage>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 flex gap-2 border-t border-zinc-100 bg-white px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-11 flex-1 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition',
                isValid && !submitting
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-zinc-300',
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saqlanmoqda…
                </>
              ) : (
                '✓ Tayinlash'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeacherPreview({
  teacher,
  remaining,
  phdOnly,
}: {
  teacher: Teacher;
  remaining: number;
  phdOnly: boolean;
}) {
  const initials = teacher.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3',
        phdOnly
          ? 'border-rose-200 bg-rose-50/60'
          : 'border-zinc-200 bg-zinc-50/70',
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900">
          {teacher.name}
        </p>
        <p className="text-xs text-zinc-500">
          Qolgan norm:{' '}
          <span
            className={cn(
              'font-medium',
              remaining < 0 ? 'text-rose-600' : 'text-emerald-700',
            )}
          >
            {remaining.toFixed(0)} soat
          </span>
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          teacher.degree === 'PhD'
            ? 'bg-violet-100 text-violet-800'
            : 'bg-zinc-100 text-zinc-700',
        )}
      >
        {DEGREE_LABEL[teacher.degree]}
      </span>
    </div>
  );
}
