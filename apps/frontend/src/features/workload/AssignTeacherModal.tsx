import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Award, BookOpen, Calculator, GraduationCap, Users } from 'lucide-react';
import type { Teacher, WorkloadType } from '@awdms/shared';
import { requiresScientificDegree } from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { useTeachers } from '@/features/teachers/api';
import { LIST_PAGE_SIZE_MAX } from '@/lib/pagination';
import {
  useAssignWorkload,
  type WorkloadItemWithRelations,
} from './api';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  item: WorkloadItemWithRelations | null;
}

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

function getSubjectCoefficient(
  item: WorkloadItemWithRelations,
): { value: number; label: string } | null {
  const subject = item.subjectOffering?.subject;
  if (!subject) return null;

  switch (item.workloadType as WorkloadType) {
    case 'lecture':
      return {
        value: subject.lectureCoefficient,
        label: 'subjects.fields.lectureCoefficient',
      };
    case 'control':
      return {
        value: subject.controlCoefficient,
        label: 'subjects.fields.controlCoefficient',
      };
    case 'practice':
      return {
        value: subject.practiceCoefficient,
        label: 'subjects.fields.practiceCoefficient',
      };
    default:
      return null;
  }
}

export function AssignTeacherModal({ open, onClose, item }: Props) {
  const { t } = useTranslation();
  const assignMut = useAssignWorkload();
  const { data: teachersList } = useTeachers({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
    isActive: true,
  });

  const [teacherId, setTeacherId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTeacherId(item?.assignedTeacher?.id ?? '');
      setError(null);
    }
  }, [open, item]);

  const selectedTeacher = useMemo(
    () => teachersList?.items.find((tc) => tc.id === teacherId),
    [teachersList, teacherId],
  );

  // Live degree-mismatch check — re-evaluates on every teacher change so the
  // UI can warn the user BEFORE they submit the request. Backend remains
  // authoritative: the @Roles/assign endpoint will reject the same case with
  // a 400 if someone bypasses this client-side guard.
  const mismatch = useMemo(() => {
    if (!item || !selectedTeacher) return false;
    const needsDegree =
      item.requiresDegree ||
      requiresScientificDegree(item.workloadType as WorkloadType);
    return needsDegree && !selectedTeacher.hasScientificDegree;
  }, [item, selectedTeacher]);

  // Over-norm pre-check: would this assignment push the teacher above their
  // annual norm? Only counts already-assigned hours (excluding current item if
  // re-assigning to the same teacher).
  const overNormBy = useMemo(() => {
    if (!item || !selectedTeacher) return 0;
    let used = teacherUsedHours(selectedTeacher);
    if (item.assignedTeacher?.id === selectedTeacher.id) {
      used -= item.plannedHours;
    }
    const projected = used + item.plannedHours;
    return Math.max(0, projected - selectedTeacher.annualNorm);
  }, [item, selectedTeacher]);

  if (!item) return null;

  const formula = item.formulaConfig;
  const subjectCoefficient = getSubjectCoefficient(item);
  const onSubmit = async () => {
    if (!teacherId) {
      setError(t('workload.assign.pick_teacher'));
      return;
    }
    setError(null);
    try {
      await assignMut.mutateAsync({ id: item.id, teacherId });
      onClose();
    } catch {
      /* hook toasts the error; keep modal open */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('workload.assign.title')}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            loading={assignMut.isPending}
            disabled={!teacherId || mismatch}
          >
            {t('workload.assign.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Workload item summary card */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                <BookOpen className="h-3 w-3" aria-hidden="true" />
                <span>{t('workload.assign.subject_label')}</span>
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900">
                {item.subjectOffering?.subject.name ?? '—'}
              </p>
              {item.subjectOffering?.subject.direction.name ? (
                <p className="text-[11px] text-zinc-500">
                  {item.subjectOffering.subject.direction.name}
                </p>
              ) : null}
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {t(`workloadType.${item.workloadType as WorkloadType}`)}
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-zinc-200">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {t('workload.assign.group_label')}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-zinc-800">
                {item.lectureStream
                  ? `Oqim · ${item.lectureStream.totalStudentCount}`
                  : item.group?.name ?? '—'}
              </p>
            </div>
            <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-zinc-200">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {t('workload.assign.students')}
              </p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums text-zinc-800">
                {item.studentCount}
              </p>
            </div>
            <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-zinc-200">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {t('workload.assign.planned_hours')}
              </p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums text-indigo-700">
                {item.plannedHours.toFixed(1)}h
              </p>
            </div>
          </div>

          {item.requiresDegree ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
              <Award className="h-3 w-3" aria-hidden="true" />
              {t('workload.requires_degree')}
            </div>
          ) : null}
        </div>

        {/* Teacher selector */}
        <Field label={t('workload.assign.teacher')}>
          <Select
            value={teacherId}
            onValueChange={(v) => setTeacherId(v ?? '')}
            placeholder={t('workload.assign.pick_teacher')}
            options={
              teachersList?.items.map((tc) => ({
                value: tc.id,
                label: tc.hasScientificDegree
                  ? `★ ${tc.fullName}`
                  : tc.fullName,
                description: tc.position,
              })) ?? []
            }
          />
        </Field>

        {/* Selected teacher preview card */}
        {selectedTeacher ? (
          <TeacherPreview
            teacher={selectedTeacher}
            mismatch={mismatch}
            overNormBy={overNormBy}
            requiredTypeLabel={t(
              `workloadType.${item.workloadType as WorkloadType}`,
            )}
          />
        ) : null}

        {/* Formula breakdown */}
        <FormulaBreakdown
          formula={formula}
          studentCount={item.studentCount}
          plannedHours={item.plannedHours}
          subjectCoefficient={
            subjectCoefficient
              ? {
                  value: subjectCoefficient.value,
                  label: t(subjectCoefficient.label),
                }
              : null
          }
        />

        {error ? (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

interface TeacherPreviewProps {
  teacher: Teacher;
  mismatch: boolean;
  overNormBy: number;
  requiredTypeLabel: string;
}

function TeacherPreview({
  teacher,
  mismatch,
  overNormBy,
  requiredTypeLabel,
}: TeacherPreviewProps) {
  const { t } = useTranslation();
  const used = teacherUsedHours(teacher);
  const remaining = Math.max(0, teacher.annualNorm - used);
  const initials = getInitials(teacher.fullName);
  const progress = Math.min(
    100,
    Math.round((used / Math.max(teacher.annualNorm, 1)) * 100),
  );

  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        mismatch
          ? 'border-red-300 bg-red-50/60'
          : overNormBy > 0
          ? 'border-amber-300 bg-amber-50/60'
          : 'border-emerald-300 bg-emerald-50/60',
      )}
      role="status"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            mismatch
              ? 'bg-red-100 text-red-700'
              : overNormBy > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-indigo-100 text-indigo-700',
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {teacher.fullName}
            </p>
            {teacher.hasScientificDegree ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">
                <GraduationCap className="h-3 w-3" aria-hidden="true" />
                {t('teachers.degree_badge')}
              </span>
            ) : (
              <span className="rounded-full bg-zinc-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                {t('workload.assign.no_degree')}
              </span>
            )}
          </div>
          {teacher.position ? (
            <p className="truncate text-[11px] text-zinc-500">
              {teacher.position}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] tabular-nums">
          <span className="text-zinc-600">
            {t('workload.assign.current_load', {
              used: used.toFixed(0),
              total: teacher.annualNorm,
            })}
          </span>
          <span className="font-semibold text-zinc-800">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress >= 100
                ? 'bg-rose-500'
                : progress >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] font-medium text-zinc-700">
          {t('workload.assign.remaining_norm', { hours: remaining.toFixed(0) })}
        </p>
      </div>

      {mismatch ? (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-red-100/70 px-2.5 py-2 text-[11px] font-medium text-red-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {t('workload.assign.degree_mismatch', { type: requiredTypeLabel })}
          </span>
        </div>
      ) : overNormBy > 0 ? (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-100/70 px-2.5 py-2 text-[11px] font-medium text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {t('workload.assign.over_norm_warning', { by: overNormBy.toFixed(0) })}
          </span>
        </div>
      ) : null}
    </div>
  );
}

interface FormulaBreakdownProps {
  formula: WorkloadItemWithRelations['formulaConfig'];
  studentCount: number;
  plannedHours: number;
  subjectCoefficient: { value: number; label: string } | null;
}

function FormulaBreakdown({
  formula,
  studentCount,
  plannedHours,
  subjectCoefficient,
}: FormulaBreakdownProps) {
  const { t } = useTranslation();

  if (!formula) {
    if (subjectCoefficient && subjectCoefficient.value > 0) {
      return (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              <Calculator className="h-3 w-3" aria-hidden="true" />
              {t('workload.assign.formula_section')}
            </div>
            <span className="text-[11px] font-medium text-zinc-500">
              {subjectCoefficient.label}
            </span>
          </div>

          <p className="mt-2 font-mono text-xs text-zinc-700">
            {studentCount} × {subjectCoefficient.value}
          </p>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-indigo-700">
              {plannedHours.toFixed(1)}
            </span>
            <span className="text-xs font-medium text-zinc-500">soat</span>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-500">
        <div className="mb-1 flex items-center gap-1.5 font-semibold uppercase tracking-wide text-zinc-600">
          <Calculator className="h-3 w-3" aria-hidden="true" />
          {t('workload.assign.formula_section')}
        </div>
        {t('workload.assign.no_formula')}
      </div>
    );
  }

  const parts: string[] = [];
  if (formula.fixedValue > 0) {
    parts.push(`${formula.fixedValue}`);
  }
  if (formula.baseHours > 0) {
    parts.push(`${formula.baseHours} ${t('workload.assign.base_hours').toLowerCase()}`);
  }
  if (formula.fixedHoursPerGroup > 0) {
    parts.push(
      `${formula.fixedHoursPerGroup} ${t('workload.assign.per_group').toLowerCase()}`,
    );
  }
  if (formula.fixedHoursPerStudent > 0) {
    parts.push(
      `${studentCount} × ${formula.fixedHoursPerStudent} ${t(
        'workload.assign.per_student',
      ).toLowerCase()}`,
    );
  }
  if (formula.coefficientPerStudent > 0) {
    parts.push(`${studentCount} × ${formula.coefficientPerStudent}`);
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
          <Calculator className="h-3 w-3" aria-hidden="true" />
          {t('workload.assign.formula_section')}
        </div>
        <span className="text-[11px] font-medium text-zinc-500">
          {formula.name}
        </span>
      </div>

      {parts.length > 0 ? (
        <p className="mt-2 font-mono text-xs text-zinc-700">
          {parts.join(' + ')}
        </p>
      ) : null}

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-indigo-700">
          {plannedHours.toFixed(1)}
        </span>
        <span className="text-xs font-medium text-zinc-500">soat</span>
      </div>
    </div>
  );
}
