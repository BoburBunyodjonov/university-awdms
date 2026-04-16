import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CreateDirectionSchema,
  type CreateDirectionInput,
  type Direction,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { useCreateDirection, useUpdateDirection } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  direction?: Direction | null;
}

const DEFAULTS: CreateDirectionInput = {
  name: '',
  code: '',
  level: 'bachelor',
};

export function DirectionFormModal({ open, onClose, direction }: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(direction);
  const createMut = useCreateDirection();
  const updateMut = useUpdateDirection(direction?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateDirectionInput>({
    resolver: zodResolver(CreateDirectionSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      reset(
        direction
          ? { name: direction.name, code: direction.code, level: direction.level }
          : DEFAULTS,
      );
    }
  }, [open, direction, reset]);

  const onSubmit = async (values: CreateDirectionInput) => {
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
        isEditing ? t('directions.edit_title') : t('directions.add_title')
      }
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="direction-form"
            loading={createMut.isPending || updateMut.isPending}
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="direction-form"
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field
          label={t('directions.fields.name')}
          error={errors.name?.message}
        >
          <Input autoFocus {...register('name')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('directions.fields.code')}
            error={errors.code?.message}
            hint={t('directions.fields.code_hint')}
          >
            <Input {...register('code')} />
          </Field>
          <Field
            label={t('directions.fields.level')}
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
                  aria-invalid={Boolean(errors.level)}
                  options={[
                    { value: 'bachelor', label: t('level.bachelor') },
                    { value: 'master', label: t('level.master') },
                  ]}
                />
              )}
            />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
