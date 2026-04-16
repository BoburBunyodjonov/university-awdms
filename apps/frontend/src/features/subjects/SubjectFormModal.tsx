import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CreateSubjectSchema,
  type CreateSubjectInput,
  type Subject,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { useDirections } from '@/features/directions/api';
import { useCreateSubject, useUpdateSubject } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  subject?: Subject | null;
}

const DEFAULTS: CreateSubjectInput = {
  name: '',
  code: '',
  directionId: '',
  level: 'bachelor',
  isActive: true,
};

export function SubjectFormModal({ open, onClose, subject }: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(subject);
  const createMut = useCreateSubject();
  const updateMut = useUpdateSubject(subject?.id ?? '');
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
    defaultValues: DEFAULTS,
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
      reset(
        subject
          ? {
              name: subject.name,
              code: subject.code ?? '',
              directionId: subject.directionId,
              level: subject.level,
              isActive: subject.isActive,
            }
          : DEFAULTS,
      );
    }
  }, [open, subject, reset]);

  const onSubmit = async (values: CreateSubjectInput) => {
    const payload = { ...values, code: values.code?.trim() || null };
    try {
      if (isEditing) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
      onClose();
    } catch {
      /* hook toasts the error; keep modal open */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? t('subjects.edit_title') : t('subjects.add_title')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="subject-form"
            loading={createMut.isPending || updateMut.isPending}
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="subject-form"
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field label={t('subjects.fields.name')} error={errors.name?.message}>
          <Input autoFocus {...register('name')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('subjects.fields.code')}
            error={errors.code?.message}
            hint={t('subjects.fields.code_hint')}
          >
            <Input {...register('code')} />
          </Field>
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
