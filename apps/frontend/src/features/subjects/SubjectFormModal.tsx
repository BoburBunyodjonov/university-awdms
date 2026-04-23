import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CreateSubjectSchema,
  EditSubjectFormSchema,
  type CreateSubjectInput,
  type EditSubjectFormInput,
  type Subject,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { MultiSelect } from '@/components/ui/multi-select';
import { useDirections } from '@/features/directions/api';
import { useCreateSubject, useUpdateSubject } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  subject?: Subject | null;
}

const CREATE_DEFAULTS: CreateSubjectInput = {
  name: '',
  directionIds: [],
  lectureCoefficient: 0,
  controlCoefficient: 0,
  practiceCoefficient: 0,
  level: 'bachelor',
  isActive: true,
};

export function SubjectFormModal({ open, onClose, subject }: Props) {
  if (!open) {
    return null;
  }
  if (subject) {
    return (
      <SubjectEditDialog
        key={subject.id}
        open
        onClose={onClose}
        subject={subject}
      />
    );
  }
  return <SubjectCreateDialog open onClose={onClose} />;
}

function SubjectCreateDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const createMut = useCreateSubject();
  const { data: directionsList } = useDirections();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateSubjectInput>({
    resolver: zodResolver(CreateSubjectSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  const level = useWatch({ control, name: 'level' });
  const directionsForLevel = useMemo(
    () => directionsList?.items.filter((d) => d.level === level) ?? [],
    [directionsList, level],
  );

  useEffect(() => {
    setValue('directionIds', [], { shouldValidate: false });
  }, [level, setValue]);

  useEffect(() => {
    if (open) {
      reset(CREATE_DEFAULTS);
    }
  }, [open, reset]);

  const onSubmit = async (values: CreateSubjectInput) => {
    try {
      await createMut.mutateAsync(values);
      onClose();
    } catch {
      /* hook toasts the error; keep modal open */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('subjects.add_title')}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="subject-form-create"
            loading={createMut.isPending}
          >
            {t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="subject-form-create"
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field label={t('subjects.fields.name')} error={errors.name?.message}>
          <Input autoFocus {...register('name')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('subjects.fields.level')}
            error={errors.level?.message}
          >
            <Controller
              name="level"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  options={[
                    { value: 'bachelor', label: t('level.bachelor') },
                    { value: 'master', label: t('level.master') },
                  ]}
                />
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field
            label={t('subjects.fields.lectureCoefficient')}
            error={errors.lectureCoefficient?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              {...register('lectureCoefficient', { valueAsNumber: true })}
            />
          </Field>
          <Field
            label={t('subjects.fields.controlCoefficient')}
            error={errors.controlCoefficient?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              {...register('controlCoefficient', { valueAsNumber: true })}
            />
          </Field>
          <Field
            label={t('subjects.fields.practiceCoefficient')}
            error={errors.practiceCoefficient?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              {...register('practiceCoefficient', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <Field
          label={t('subjects.fields.directions_multi')}
          error={errors.directionIds?.message as string | undefined}
          hint={t('subjects.fields.directions_multi_hint')}
        >
          <Controller
            name="directionIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t('subjects.multi_select_placeholder')}
                aria-label={t('subjects.fields.directions_multi')}
                aria-invalid={Boolean(errors.directionIds)}
                options={directionsForLevel.map((d) => ({
                  value: d.id,
                  label: `${d.code} — ${d.name}`,
                }))}
                emptyContent={t('subjects.no_directions_for_level')}
              />
            )}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            {...register('isActive')}
          />
          {t('subjects.fields.isActive')}
        </label>
      </form>
    </Dialog>
  );
}

function SubjectEditDialog({
  open,
  onClose,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  subject: Subject;
}) {
  const { t } = useTranslation();
  const updateMut = useUpdateSubject(subject.id);
  const { data: directionsList } = useDirections();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditSubjectFormInput>({
    resolver: zodResolver(EditSubjectFormSchema),
    defaultValues: {
      name: subject.name,
      lectureCoefficient: subject.lectureCoefficient ?? 0,
      controlCoefficient: subject.controlCoefficient ?? 0,
      practiceCoefficient: subject.practiceCoefficient ?? 0,
      directionId: subject.directionId,
      level: subject.level,
      isActive: subject.isActive,
    },
  });

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
      reset({
        name: subject.name,
        lectureCoefficient: subject.lectureCoefficient ?? 0,
        controlCoefficient: subject.controlCoefficient ?? 0,
        practiceCoefficient: subject.practiceCoefficient ?? 0,
        directionId: subject.directionId,
        level: subject.level,
        isActive: subject.isActive,
      });
    }
  }, [open, subject, reset]);

  const onSubmit = async (values: EditSubjectFormInput) => {
    try {
      await updateMut.mutateAsync(values);
      onClose();
    } catch {
      /* hook toasts the error; keep modal open */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('subjects.edit_title')}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="subject-form-edit"
            loading={updateMut.isPending}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="subject-form-edit"
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field label={t('subjects.fields.name')} error={errors.name?.message}>
          <Input autoFocus {...register('name')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('subjects.fields.direction')}
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
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field
            label={t('subjects.fields.lectureCoefficient')}
            error={errors.lectureCoefficient?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              {...register('lectureCoefficient', { valueAsNumber: true })}
            />
          </Field>
          <Field
            label={t('subjects.fields.controlCoefficient')}
            error={errors.controlCoefficient?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              {...register('controlCoefficient', { valueAsNumber: true })}
            />
          </Field>
          <Field
            label={t('subjects.fields.practiceCoefficient')}
            error={errors.practiceCoefficient?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              {...register('practiceCoefficient', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            {...register('isActive')}
          />
          {t('subjects.fields.isActive')}
        </label>

        <input type="hidden" {...register('level')} />
      </form>
    </Dialog>
  );
}
