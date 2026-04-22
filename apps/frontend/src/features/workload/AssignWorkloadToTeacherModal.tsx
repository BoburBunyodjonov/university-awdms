import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, GraduationCap, Info, Zap } from 'lucide-react';
import type { Teacher, WorkloadType } from '@awdms/shared';
import {
  categoryOf,
  isIndivisibleAuditoriumWorkload,
  requiresScientificDegree,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAcademicYears } from '@/features/academic-years/api';
import { useSubjects } from '@/features/subjects/api';
import { useGroups } from '@/features/groups/api';
import { useStreams } from '@/features/lecture-streams/api';
import { useCreateWorkload } from './api';
import { LIST_PAGE_SIZE_MAX } from '@/lib/pagination';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}

type ScopeKind = 'group' | 'stream';

/**
 * Smart field spec per workload type — drives which inputs show and how
 * `plannedHours` is computed live. Mirrors §4 of the AWDMS UI spec.
 */
interface TypeSpec {
  /** Ko'rsatish uchun `subject` dropdown. */
  subject?: boolean;
  /** Bitta guruh / oqim / ko'p guruh tanlash. */
  scope?: 'group' | 'group_or_stream' | 'groups_multi';
  students?: boolean;
  /** Rule — `scientific_*` va `phd_supervision_*` uchun maksimum 3. */
  studentsMax?: number;
  coefficient?: boolean;
  fixedHours?: boolean;
  /** Rule 13 — ilmiy daraja shart bo'lgan turlar (badge + validation). */
  phdOnly?: boolean;
  /** Rule 12 — 1 guruh = 1 o'qituvchi (individual_project). */
  groupLockHint?: boolean;
  /** Rule 3 — ma'ruza/amaliyotni bo'lib yuborib bo'lmaydi. */
  indivisibleHint?: boolean;
}

const TYPE_SPEC: Partial<Record<WorkloadType, TypeSpec>> = {
  lecture: {
    subject: true,
    scope: 'group_or_stream',
    fixedHours: true,
    indivisibleHint: true,
  },
  practice: {
    subject: true,
    scope: 'groups_multi',
    fixedHours: true,
    indivisibleHint: true,
  },
  control: { subject: true, students: true, coefficient: true },
  individual_project: {
    subject: true,
    scope: 'group',
    students: true,
    coefficient: true,
    groupLockHint: true,
  },
  VQR_full_time: { students: true, coefficient: true },
  VQR_part_time: { students: true, coefficient: true },
  internship: { scope: 'group', students: true, fixedHours: true },
  prediploma: { scope: 'group', students: true, fixedHours: true },
  scientific_pedagogical: {
    students: true,
    studentsMax: 3,
    coefficient: true,
    phdOnly: true,
  },
  scientific_internship: {
    students: true,
    studentsMax: 3,
    coefficient: true,
    phdOnly: true,
  },
  phd_supervision_parttime: {
    students: true,
    studentsMax: 3,
    coefficient: true,
    phdOnly: true,
  },
  phd_supervision_fulltime: {
    students: true,
    studentsMax: 3,
    coefficient: true,
    phdOnly: true,
  },
};

const AUDITORIUM_TYPES: WorkloadType[] = [
  'lecture',
  'practice',
  'control',
  'individual_project',
];
const NON_AUDITORIUM_TYPES: WorkloadType[] = [
  'VQR_full_time',
  'VQR_part_time',
  'internship',
  'prediploma',
  'scientific_pedagogical',
  'scientific_internship',
  'phd_supervision_parttime',
  'phd_supervision_fulltime',
];

interface FormState {
  subjectId: string;
  scopeKind: ScopeKind;
  groupId: string;
  streamId: string;
  groupIds: string[];
  studentCount: number;
  coefficient: number;
  fixedHours: number;
}

const DEFAULT_FORM: FormState = {
  subjectId: '',
  scopeKind: 'group',
  groupId: '',
  streamId: '',
  groupIds: [],
  studentCount: 0,
  coefficient: 0,
  fixedHours: 0,
};

function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function teacherUsedHours(teacher: Teacher): number {
  return (teacher.auditoriumHours ?? 0) + (teacher.nonAuditoriumHours ?? 0);
}

function roundHours(n: number): string {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
}

interface ComputeResult {
  hours: number;
  /** Har bir tur uchun live formula matni (screenshot'dagi "2 talaba × 150" kabi). */
  text: string;
}

function computeHours(
  type: WorkloadType,
  state: FormState,
  tWorkType: (wt: WorkloadType) => string,
): ComputeResult {
  const spec = TYPE_SPEC[type];
  if (!spec) return { hours: 0, text: '—' };

  const s = Number.isFinite(state.studentCount) ? state.studentCount : 0;
  const c = Number.isFinite(state.coefficient) ? state.coefficient : 0;
  const f = Number.isFinite(state.fixedHours) ? state.fixedHours : 0;
  const gCount = state.groupIds.length;

  if (type === 'lecture') {
    return { hours: f, text: `Fixed ${roundHours(f)}` };
  }
  if (type === 'practice') {
    return { hours: f * gCount, text: `${gCount} × ${roundHours(f)}` };
  }
  if (type === 'internship' || type === 'prediploma') {
    return { hours: f * s, text: `${s} × ${roundHours(f)}` };
  }
  if (type === 'individual_project') {
    const g = 1; // single-group constraint (Rule 12)
    return { hours: s * g * c, text: `${s} × ${g} × ${c}` };
  }
  // control, VQR_*, scientific_*, phd_supervision_*
  void tWorkType;
  return { hours: s * c, text: `${s} × ${c}` };
}

/**
 * Smart modal: fields swap per workload-type; formula computes live; Rule 13
 * (PhD only), student caps, and §3 (practice indivisible) validations surface
 * as inline banners. Submit chains POST /workload + POST /workload/:id/assign.
 */
export function AssignWorkloadToTeacherModal({ open, onClose, teacher }: Props) {
  const { t } = useTranslation();
  const { data: years } = useAcademicYears();
  const createMut = useCreateWorkload();

  const activeYearId = years?.find((y) => y.isActive)?.id ?? years?.[0]?.id ?? '';

  const [workloadType, setWorkloadType] = useState<WorkloadType | ''>('');
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [yearId, setYearId] = useState<string>('');

  const spec = workloadType ? TYPE_SPEC[workloadType] : undefined;

  useEffect(() => {
    if (open) {
      setWorkloadType('');
      setForm(DEFAULT_FORM);
      setYearId('');
    }
  }, [open]);

  // When type changes, reset fields that no longer apply. Keep user-entered
  // values for fields that carry over between similar types (students, coef).
  useEffect(() => {
    if (!spec) return;
    setForm((prev) => ({
      ...prev,
      subjectId: spec.subject ? prev.subjectId : '',
      scopeKind:
        spec.scope === 'group_or_stream' ? prev.scopeKind : 'group',
      groupId:
        spec.scope === 'group' ||
        (spec.scope === 'group_or_stream' && prev.scopeKind === 'group')
          ? prev.groupId
          : '',
      streamId:
        spec.scope === 'group_or_stream' && prev.scopeKind === 'stream'
          ? prev.streamId
          : '',
      groupIds: spec.scope === 'groups_multi' ? prev.groupIds : [],
      studentCount: spec.students ? prev.studentCount : 0,
      coefficient: spec.coefficient ? prev.coefficient : 0,
      fixedHours: spec.fixedHours ? prev.fixedHours : 0,
    }));
  }, [spec]);

  // Lookups (enabled only when relevant field is visible, to avoid wasted API calls)
  const { data: subjectsData } = useSubjects({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
    isActive: true,
  });
  const { data: groupsData } = useGroups({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
  });
  const { data: streamsData } = useStreams({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
  });

  const compute = useMemo(() => {
    if (!workloadType)
      return { hours: 0, text: t('workload.assign_to_teacher.pick_type') };
    return computeHours(workloadType, form, (wt) => t(`workloadType.${wt}`));
  }, [workloadType, form, t]);

  const degreeMismatch = useMemo(() => {
    if (!workloadType || !teacher) return false;
    return (
      requiresScientificDegree(workloadType) && !teacher.hasScientificDegree
    );
  }, [workloadType, teacher]);

  const studentOverCap = useMemo(() => {
    if (!spec?.studentsMax) return false;
    return form.studentCount > spec.studentsMax;
  }, [spec, form.studentCount]);

  const practiceSplitHint = useMemo(() => {
    if (!workloadType) return false;
    return isIndivisibleAuditoriumWorkload(workloadType);
  }, [workloadType]);

  const overNormBy = useMemo(() => {
    if (!teacher) return 0;
    const used = teacherUsedHours(teacher);
    return Math.max(0, used + compute.hours - teacher.annualNorm);
  }, [teacher, compute.hours]);

  if (!teacher) return null;

  const effectiveYearId = yearId || activeYearId;

  // Form validity — one gate per constraint; submit button follows.
  const fieldsFilled = (() => {
    if (!spec) return false;
    if (spec.subject && !form.subjectId) return false;
    if (spec.scope === 'group' && !form.groupId) return false;
    if (spec.scope === 'group_or_stream') {
      if (form.scopeKind === 'group' && !form.groupId) return false;
      if (form.scopeKind === 'stream' && !form.streamId) return false;
    }
    if (spec.scope === 'groups_multi' && form.groupIds.length === 0)
      return false;
    if (spec.students && form.studentCount <= 0) return false;
    if (spec.coefficient && form.coefficient <= 0) return false;
    if (spec.fixedHours && form.fixedHours <= 0) return false;
    return true;
  })();

  const canSubmit =
    Boolean(workloadType) &&
    Boolean(effectiveYearId) &&
    fieldsFilled &&
    !degreeMismatch &&
    !studentOverCap &&
    overNormBy <= 0 &&
    compute.hours > 0;

  const onSubmit = async () => {
    if (!workloadType || !effectiveYearId || !canSubmit) return;
    try {
      await createMut.mutateAsync({
        academicYearId: effectiveYearId,
        workloadType,
        category: categoryOf(workloadType),
        studentCount: form.studentCount || 0,
        plannedHours: compute.hours,
        requiresDegree: requiresScientificDegree(workloadType),
        assignedTeacherId: teacher.id,
        groupId:
          spec?.scope === 'group'
            ? form.groupId || null
            : spec?.scope === 'group_or_stream' && form.scopeKind === 'group'
              ? form.groupId || null
              : null,
        lectureStreamId:
          spec?.scope === 'group_or_stream' && form.scopeKind === 'stream'
            ? form.streamId || null
            : null,
        status: 'assigned',
      });
      onClose();
    } catch {
      /* toast handled by mutation onError */
    }
  };

  const used = teacherUsedHours(teacher);
  const remaining = Math.max(0, teacher.annualNorm - used);
  const initials = getInitials(teacher.fullName);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('workload.assign_to_teacher.title')}
      className="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            loading={createMut.isPending}
            disabled={!canSubmit}
          >
            {t('workload.assign.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {/* Teacher (locked) */}
        <Field label={`${t('workload.assign.teacher')} *`}>
          <Select
            value={teacher.id}
            onValueChange={() => {
              /* locked */
            }}
            disabled
            options={[
              {
                value: teacher.id,
                label: `${teacher.fullName} (${teacher.degreeName})`,
              },
            ]}
          />
        </Field>

        {/* Teacher preview card */}
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/70 p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-900">
              {teacher.fullName}
            </p>
            <p className="truncate text-[11px] text-zinc-500">
              {t('workload.assign_to_teacher.remaining_norm_label')}:{' '}
              <span
                className={cn(
                  'font-semibold',
                  remaining > 0 ? 'text-emerald-700' : 'text-red-700',
                )}
              >
                {remaining.toFixed(0)} {t('workload.assign_to_teacher.hours_short')}
              </span>
            </p>
          </div>
          {teacher.hasScientificDegree ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">
              <GraduationCap className="h-3 w-3" aria-hidden="true" />
              {t('teachers.degree_badge')}
            </span>
          ) : null}
        </div>

        {/* Workload type (grouped) */}
        <Field label={`${t('workload.assign.type_label')} *`}>
          <Select
            value={workloadType}
            onValueChange={(v) => setWorkloadType((v as WorkloadType) || '')}
            placeholder={t('workload.assign_to_teacher.pick_type')}
            groupedOptions={[
              {
                label: t('workload.categories.auditorium'),
                options: AUDITORIUM_TYPES.map((wt) => ({
                  value: wt,
                  label: t(`workloadType.${wt}`),
                })),
              },
              {
                label: t('workload.categories.non_auditorium'),
                options: NON_AUDITORIUM_TYPES.map((wt) => ({
                  value: wt,
                  label: t(`workloadType.${wt}`),
                  description: requiresScientificDegree(wt)
                    ? t('workload.assign_to_teacher.phd_only_short')
                    : undefined,
                })),
              },
            ]}
          />
        </Field>

        {/* Dynamic fields (change per type) */}
        {spec ? (
          <div className="space-y-3 rounded-lg border border-dashed border-zinc-300 bg-white p-3">
            {spec.subject ? (
              <Field label={`${t('workload.assign.subject_label')} *`}>
                <Select
                  value={form.subjectId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, subjectId: v ?? '' }))
                  }
                  placeholder={t('workload.assign_to_teacher.pick_subject')}
                  options={
                    subjectsData?.items.map((s) => ({
                      value: s.id,
                      label: s.name,
                      description: s.direction?.name,
                    })) ?? []
                  }
                />
              </Field>
            ) : null}

            {spec.scope === 'group_or_stream' ? (
              <div className="space-y-2">
                <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, scopeKind: 'group' }))
                    }
                    className={cn(
                      'rounded px-3 py-1 font-medium',
                      form.scopeKind === 'group'
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100',
                    )}
                  >
                    {t('workload.group')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, scopeKind: 'stream' }))
                    }
                    className={cn(
                      'rounded px-3 py-1 font-medium',
                      form.scopeKind === 'stream'
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100',
                    )}
                  >
                    {t('workload.stream_badge')}
                  </button>
                </div>
                {form.scopeKind === 'group' ? (
                  <Field label={`${t('workload.group')} *`}>
                    <Select
                      value={form.groupId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, groupId: v ?? '' }))
                      }
                      placeholder={t('workload.assign_to_teacher.pick_group')}
                      options={
                        groupsData?.items.map((g) => ({
                          value: g.id,
                          label: g.name,
                          description: `${g.direction?.name ?? ''} · ${g.studentCount} ${t('offerings.students_short')}`,
                        })) ?? []
                      }
                    />
                  </Field>
                ) : (
                  <Field label={`${t('workload.stream_badge')} *`}>
                    <Select
                      value={form.streamId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, streamId: v ?? '' }))
                      }
                      placeholder={t('workload.assign_to_teacher.pick_stream')}
                      options={
                        streamsData?.items.map((s) => ({
                          value: s.id,
                          label: `${s.language} · ${s.totalStudentCount} ${t('workload.stream_students')}`,
                        })) ?? []
                      }
                    />
                  </Field>
                )}
              </div>
            ) : null}

            {spec.scope === 'group' ? (
              <Field label={`${t('workload.group')} *`}>
                <Select
                  value={form.groupId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, groupId: v ?? '' }))
                  }
                  placeholder={t('workload.assign_to_teacher.pick_group')}
                  options={
                    groupsData?.items.map((g) => ({
                      value: g.id,
                      label: g.name,
                      description: `${g.direction?.name ?? ''} · ${g.studentCount} ${t('offerings.students_short')}`,
                    })) ?? []
                  }
                />
              </Field>
            ) : null}

            {spec.scope === 'groups_multi' ? (
              <Field label={`${t('workload.assign_to_teacher.groups_multi')} *`}>
                <MultiSelect
                  value={form.groupIds}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, groupIds: v }))
                  }
                  placeholder={t('workload.assign_to_teacher.pick_groups')}
                  options={
                    groupsData?.items.map((g) => ({
                      value: g.id,
                      label: g.name,
                      description: g.direction?.name,
                    })) ?? []
                  }
                />
              </Field>
            ) : null}

            {spec.students ? (
              <Field
                label={
                  spec.studentsMax
                    ? `${t('workload.assign_to_teacher.student_count')} * (max ${spec.studentsMax})`
                    : `${t('workload.assign_to_teacher.student_count')} *`
                }
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={form.studentCount > 0 ? form.studentCount : ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setForm((f) => ({
                      ...f,
                      studentCount: raw === '' ? 0 : parseInt(raw, 10) || 0,
                    }));
                  }}
                  aria-invalid={studentOverCap}
                />
              </Field>
            ) : null}

            {spec.coefficient ? (
              <Field label={`${t('workload.assign_to_teacher.coefficient')} *`}>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={form.coefficient > 0 ? form.coefficient : ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setForm((f) => ({
                      ...f,
                      coefficient:
                        raw === '' ? 0 : Number.parseFloat(raw) || 0,
                    }));
                  }}
                />
              </Field>
            ) : null}

            {spec.fixedHours ? (
              <Field label={`${t('workload.assign_to_teacher.fixed_hours')} *`}>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={form.fixedHours > 0 ? form.fixedHours : ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setForm((f) => ({
                      ...f,
                      fixedHours:
                        raw === '' ? 0 : Number.parseFloat(raw) || 0,
                    }));
                  }}
                />
              </Field>
            ) : null}
          </div>
        ) : null}

        {/* Year (shown only if >1 year exists) */}
        {years && years.length > 1 ? (
          <Field label={t('nav.academic_years', { defaultValue: 'Yil' })}>
            <Select
              value={effectiveYearId}
              onValueChange={(v) => setYearId(v ?? '')}
              options={years.map((y) => ({
                value: y.id,
                label: y.isActive ? `★ ${y.name}` : y.name,
              }))}
            />
          </Field>
        ) : null}

        {/* Formula & calculation preview (always visible when type picked) */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
            <Zap className="h-3 w-3" aria-hidden="true" />
            {t('workload.assign_to_teacher.formula_header')}
          </div>
          <p className="font-mono text-xs text-zinc-700">{compute.text}</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-zinc-900">
              {roundHours(compute.hours)}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              {t('workload.assign_to_teacher.hours_short')}
            </span>
          </p>
        </div>

        {/* Validation banners (order: blocking errors first, hints second) */}
        {degreeMismatch ? (
          <ValidationBanner
            tone="error"
            text={t('workload.assign.degree_mismatch', {
              type: workloadType ? t(`workloadType.${workloadType}`) : '',
            })}
          />
        ) : null}

        {studentOverCap && spec?.studentsMax ? (
          <ValidationBanner
            tone="error"
            text={t('workload.assign_to_teacher.students_over_cap', {
              max: spec.studentsMax,
            })}
          />
        ) : null}

        {spec?.groupLockHint ? (
          <ValidationBanner
            tone="info"
            text={t('workload.assign_to_teacher.group_lock_hint')}
          />
        ) : null}

        {spec?.indivisibleHint && practiceSplitHint ? (
          <ValidationBanner
            tone="info"
            text={t('workload.assign_to_teacher.indivisible_hint')}
          />
        ) : null}

        {overNormBy > 0 && !degreeMismatch && !studentOverCap ? (
          <ValidationBanner
            tone="error"
            text={t('workload.assign.over_norm_warning', {
              by: overNormBy.toFixed(0),
            })}
          />
        ) : null}
      </div>
    </Dialog>
  );
}

function ValidationBanner({
  tone,
  text,
}: {
  tone: 'error' | 'warn' | 'info';
  text: string;
}) {
  const toneCls =
    tone === 'error'
      ? 'border-red-300 bg-red-50 text-red-800'
      : tone === 'warn'
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-sky-300 bg-sky-50 text-sky-800';
  const Icon = tone === 'info' ? Info : AlertTriangle;
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border px-2.5 py-2 text-[11px] font-medium',
        toneCls,
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
