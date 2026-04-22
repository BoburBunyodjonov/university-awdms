import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CreateGroupSchema,
  type CreateGroupInput,
  type Group,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { useDirections } from '@/features/directions/api';
import { useCreateGroup, useUpdateGroup } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  group?: Group | null;
}

const DEFAULTS: CreateGroupInput = {
  name: '',
  directionId: '',
  level: 'bachelor',
  studyType: 'full_time',
  courseYear: 1,
  semesterNumber: 1,
  academicTerm: 'fall',
  language: 'uzbek',
  studentCount: 25,
};

export function GroupFormModal({ open, onClose, group }: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(group);
  const createMut = useCreateGroup();
  const updateMut = useUpdateGroup(group?.id ?? '');
  const { data: directionsList } = useDirections();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    setValue,
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: DEFAULTS,
  });

  // When the user picks a direction, sync `level` so backend's
  // direction/level consistency check passes on first try.
  const directionId = useWatch({ control, name: 'directionId' });
  const selectedDirection = useMemo(
    () => directionsList?.items.find((d) => d.id === directionId),
    [directionsList, directionId],
  );
  useEffect(() => {
    if (selectedDirection) {
      setValue('level', selectedDirection.level, { shouldValidate: false });
    }
  }, [selectedDirection, setValue]);

  useEffect(() => {
    if (open) {
      reset(
        group
          ? {
              name: group.name,
              directionId: group.directionId,
              level: group.level,
              studyType: group.studyType,
              courseYear: group.courseYear,
              semesterNumber: group.semesterNumber,
              academicTerm: group.academicTerm,
              language: group.language,
              studentCount: group.studentCount,
            }
          : DEFAULTS,
      );
    }
  }, [open, group, reset]);

  const onSubmit = async (values: CreateGroupInput) => {
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
      title={isEditing ? t('groups.edit_title') : t('groups.add_title')}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="group-form"
            loading={createMut.isPending || updateMut.isPending}
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="group-form"
        className="grid grid-cols-2 gap-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field label={t('groups.fields.name')} error={errors.name?.message}>
          <Input autoFocus placeholder="TI-21-01" {...register('name')} />
        </Field>

        <Field
          label={t('groups.fields.direction')}
          error={errors.directionId?.message}
        >
          <Controller
            name="directionId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v ?? '')}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.directionId)}
                placeholder={t('groups.pick_direction')}
                options={
                  directionsList?.items.map((d) => ({
                    value: d.id,
                    label: `${d.code} — ${d.name}`,
                    description: t(`level.${d.level}`),
                  })) ?? []
                }
              />
            )}
          />
        </Field>

        <Field
          label={t('groups.fields.language')}
          error={errors.language?.message}
        >
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v)}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.language)}
                options={[
                  { value: 'uzbek', label: t('language.uzbek') },
                  { value: 'russian', label: t('language.russian') },
                ]}
              />
            )}
          />
        </Field>

        <Field
          label={t('groups.fields.studyType')}
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
          label={t('groups.fields.courseYear')}
          error={errors.courseYear?.message}
        >
          <Input
            type="number"
            min={1}
            max={6}
            {...register('courseYear', { valueAsNumber: true })}
          />
        </Field>

        {/* Semester / term: fixed defaults for new groups; on edit, existing DB values (hidden). */}
        <input
          type="hidden"
          {...register('semesterNumber', { valueAsNumber: true })}
        />
        <input type="hidden" {...register('academicTerm')} />

        <Field
          label={t('groups.fields.studentCount')}
          error={errors.studentCount?.message}
        >
          <Input
            type="number"
            min={1}
            max={1000}
            {...register('studentCount', { valueAsNumber: true })}
          />
        </Field>

        {/* Hidden: level is synchronised with the chosen direction */}
        <input type="hidden" {...register('level')} />

      </form>
    </Dialog>
  );
}
