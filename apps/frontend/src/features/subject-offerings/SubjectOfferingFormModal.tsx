import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CreateSubjectOfferingSchema,
  type CreateSubjectOfferingInput,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { useSubjects } from '@/features/subjects/api';
import { useGroups } from '@/features/groups/api';
import {
  useCreateSubjectOffering,
  useUpdateSubjectOffering,
  type OfferingWithRelations,
} from './api';
import { LIST_PAGE_SIZE_MAX } from '@/lib/pagination';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  offering?: OfferingWithRelations | null;
}

const DEFAULTS: CreateSubjectOfferingInput = {
  subjectId: '',
  studyType: 'full_time',
  courseYear: 1,
  semesterNumber: 1,
  academicTerm: 'fall',
  isActive: true,
  groupIds: [],
};

export function SubjectOfferingFormModal({ open, onClose, offering }: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(offering);
  const createMut = useCreateSubjectOffering();
  const updateMut = useUpdateSubjectOffering(offering?.id ?? '');

  const { data: subjectsList } = useSubjects({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateSubjectOfferingInput>({
    resolver: zodResolver(CreateSubjectOfferingSchema),
    defaultValues: DEFAULTS,
  });

  const subjectId = useWatch({ control, name: 'subjectId' });
  const selectedGroupIds = useWatch({ control, name: 'groupIds' }) ?? [];

  const selectedSubject = useMemo(
    () => subjectsList?.items.find((s) => s.id === subjectId),
    [subjectsList, subjectId],
  );

  // Only groups matching the subject's direction + level may be linked.
  const { data: candidateGroups } = useGroups(
    {
      page: 1,
      pageSize: LIST_PAGE_SIZE_MAX,
      directionId: selectedSubject?.directionId,
      level: selectedSubject?.level,
    },
    { enabled: Boolean(selectedSubject) },
  );

  useEffect(() => {
    if (open) {
      reset(
        offering
          ? {
              subjectId: offering.subjectId,
              studyType: offering.studyType,
              courseYear: offering.courseYear,
              semesterNumber: offering.semesterNumber,
              academicTerm: offering.academicTerm,
              isActive: offering.isActive,
              groupIds: offering.groupLinks.map((l) => l.groupId),
            }
          : DEFAULTS,
      );
    }
  }, [open, offering, reset]);

  const toggleGroup = (groupId: string) => {
    const next = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((id) => id !== groupId)
      : [...selectedGroupIds, groupId];
    setValue('groupIds', next, { shouldDirty: true });
  };

  const onSubmit = async (values: CreateSubjectOfferingInput) => {
    try {
      if (isEditing) await updateMut.mutateAsync(values);
      else await createMut.mutateAsync(values);
      onClose();
    } catch {
      /* hook toasts the error; keep modal open */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        isEditing ? t('offerings.edit_title') : t('offerings.add_title')
      }
      className="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="offering-form"
            loading={createMut.isPending || updateMut.isPending}
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="offering-form"
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('offerings.fields.subject')}
            error={errors.subjectId?.message}
          >
            <Controller
              name="subjectId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? '')}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.subjectId)}
                  placeholder={t('offerings.pick_subject')}
                  options={
                    subjectsList?.items.map((s) => ({
                      value: s.id,
                      label: s.name,
                      description: `${s.direction.code} / ${t(`level.${s.level}`)}`,
                    })) ?? []
                  }
                />
              )}
            />
          </Field>

          <Field
            label={t('offerings.fields.studyType')}
            error={errors.studyType?.message}
          >
            <Controller
              name="studyType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.studyType)}
                  options={[
                    { value: 'full_time', label: t('studyType.full_time') },
                    { value: 'part_time', label: t('studyType.part_time') },
                  ]}
                />
              )}
            />
          </Field>

          <Field
            label={t('offerings.fields.courseYear')}
            error={errors.courseYear?.message}
          >
            <Input
              type="number"
              min={1}
              max={6}
              {...register('courseYear', { valueAsNumber: true })}
            />
          </Field>

          <Field
            label={t('offerings.fields.semesterNumber')}
            error={errors.semesterNumber?.message}
          >
            <Input
              type="number"
              min={1}
              max={12}
              {...register('semesterNumber', { valueAsNumber: true })}
            />
          </Field>

          <Field
            label={t('offerings.fields.academicTerm')}
            error={errors.academicTerm?.message}
          >
            <Controller
              name="academicTerm"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.academicTerm)}
                  options={[
                    { value: 'fall', label: t('academicTerm.fall') },
                    { value: 'spring', label: t('academicTerm.spring') },
                  ]}
                />
              )}
            />
          </Field>

          <label className="flex items-end gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300"
              {...register('isActive')}
            />
            {t('offerings.fields.isActive')}
          </label>
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-medium text-zinc-700">
              {t('offerings.fields.groups')}
            </span>
            <span className="text-xs text-zinc-500">
              {t('offerings.selected_count', {
                count: selectedGroupIds.length,
              })}
            </span>
          </div>
          {!selectedSubject ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
              {t('offerings.pick_subject_first')}
            </div>
          ) : !candidateGroups || candidateGroups.items.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
              {t('offerings.no_matching_groups')}
            </div>
          ) : (
            <div className="max-h-60 overflow-auto rounded-md border border-zinc-200 bg-white">
              <ul className="divide-y divide-zinc-100">
                {candidateGroups.items.map((g) => {
                  const checked = selectedGroupIds.includes(g.id);
                  return (
                    <li key={g.id}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm',
                          checked ? 'bg-blue-50' : 'hover:bg-zinc-50',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-300"
                            checked={checked}
                            onChange={() => toggleGroup(g.id)}
                          />
                          <span className="font-medium text-zinc-900">
                            {g.name}
                          </span>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-1.5 py-0.5 text-[10px]',
                              g.language === 'uzbek'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-sky-200 bg-sky-50 text-sky-800',
                            )}
                          >
                            {t(`language.${g.language}`)}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {t('groups.fields.courseYear')} {g.courseYear} ·{' '}
                          {g.studentCount} {t('offerings.students_short')}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {errors.groupIds ? (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.groupIds.message as string}
            </p>
          ) : null}
        </div>

      </form>
    </Dialog>
  );
}
