import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Award, User } from 'lucide-react';
import type { WorkloadType } from '@awdms/shared';
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

  // Live degree-mismatch check — re-evaluates on every teacher change so the
  // UI can warn the user BEFORE they submit the request. Backend remains
  // authoritative: the @Roles/assign endpoint will reject the same case with
  // a 400 if someone bypasses this client-side guard.
  const mismatch = useMemo(() => {
    if (!item || !teacherId) return false;
    const teacher = teachersList?.items.find((t) => t.id === teacherId);
    if (!teacher) return false;
    const needsDegree =
      item.requiresDegree ||
      requiresScientificDegree(item.workloadType as WorkloadType);
    return needsDegree && !teacher.hasScientificDegree;
  }, [item, teacherId, teachersList]);

  if (!item) return null;

  const selectedTeacher = teachersList?.items.find((t) => t.id === teacherId);

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
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            loading={assignMut.isPending}
            disabled={!teacherId}
          >
            {t('workload.assign.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-900">
              {item.subjectOffering?.subject.name ?? '—'}
            </span>
            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-medium text-zinc-700">
              {t(`workloadType.${item.workloadType as WorkloadType}`)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-zinc-600">
            <span>
              {item.studentCount} {t('offerings.students_short')}
            </span>
            <span>·</span>
            <span className="tabular-nums">
              {item.plannedHours}h {t('workload.planned')}
            </span>
            {item.requiresDegree ? (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Award className="h-3 w-3" aria-hidden="true" />
                {t('workload.requires_degree')}
              </span>
            ) : null}
          </div>
        </div>

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

        {selectedTeacher ? (
          <div
            className={cn(
              'rounded-md border p-3 text-xs',
              mismatch
                ? 'border-red-300 bg-red-50 text-red-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900',
            )}
            role="status"
          >
            <div className="flex items-center gap-2 font-medium">
              {mismatch ? (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <User className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{selectedTeacher.fullName}</span>
              {selectedTeacher.hasScientificDegree ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-900">
                  <Award className="h-3 w-3" aria-hidden="true" />
                  {t('teachers.degree_badge')}
                </span>
              ) : null}
            </div>
            <div className="mt-1">
              {mismatch
                ? t('workload.assign.degree_mismatch', {
                    type: t(
                      `workloadType.${item.workloadType as WorkloadType}`,
                    ),
                  })
                : t('workload.assign.ok', {
                    norm: selectedTeacher.annualNorm,
                  })}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
