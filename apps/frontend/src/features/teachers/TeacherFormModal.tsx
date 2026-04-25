import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CreateTeacherSchema,
  type CreateTeacherInput,
  type Teacher,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateTeacher, useUpdateTeacher } from './api';

interface TeacherFormModalProps {
  open: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
}

type ScientificDegreeName = "Ilmiy daraja yo'q" | 'PhD' | 'DSc';

const DEFAULTS: CreateTeacherInput = {
  fullName: '',
  degreeName: "Ilmiy daraja yo'q",
  hasScientificDegree: false,
  position: '',
  annualNorm: 850,
  isActive: true,
};

const DEGREE_OPTIONS: ScientificDegreeName[] = [
  "Ilmiy daraja yo'q",
  'PhD',
  'DSc',
];

function normalizeDegreeName(value: string): ScientificDegreeName {
  if (value === 'PhD') return 'PhD';
  if (value === 'DSc' || value === 'DSC') return 'DSc';
  return "Ilmiy daraja yo'q";
}

function degreeHasScientificDegree(value: ScientificDegreeName) {
  return value === 'PhD' || value === 'DSc';
}

export function TeacherFormModal({
  open,
  onClose,
  teacher,
}: TeacherFormModalProps) {
  const { t } = useTranslation();
  const isEditing = Boolean(teacher);
  const createMut = useCreateTeacher();
  const updateMut = useUpdateTeacher(teacher?.id ?? '');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeacherInput>({
    resolver: zodResolver(CreateTeacherSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      reset(
        teacher
          ? {
              fullName: teacher.fullName,
              degreeName: normalizeDegreeName(teacher.degreeName),
              hasScientificDegree: degreeHasScientificDegree(
                normalizeDegreeName(teacher.degreeName),
              ),
              position: teacher.position,
              annualNorm: teacher.annualNorm,
              isActive: teacher.isActive,
            }
          : DEFAULTS,
      );
    }
  }, [open, teacher, reset]);

  const onSubmit = async (values: CreateTeacherInput) => {
    // Error toast fires from the mutation hook; keep the modal open so the
    // user can retry after correcting input.
    const degreeName = normalizeDegreeName(values.degreeName);
    const input = {
      ...values,
      degreeName,
      hasScientificDegree: degreeHasScientificDegree(degreeName),
    };
    try {
      if (isEditing) await updateMut.mutateAsync(input);
      else await createMut.mutateAsync(input);
      onClose();
    } catch {
      /* handled by hook's onError → toast */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? t('teachers.edit_title') : t('teachers.add_title')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="teacher-form"
            loading={createMut.isPending || updateMut.isPending}
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="teacher-form"
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field
          label={t('teachers.fields.fullName')}
          error={errors.fullName?.message}
        >
          <Input autoFocus {...register('fullName')} />
        </Field>

        <Field
          label={t('teachers.fields.position')}
          error={errors.position?.message}
        >
          <Input {...register('position')} />
        </Field>

        <Field
          label={t('teachers.fields.degreeName')}
          error={errors.degreeName?.message}
          hint={t('teachers.fields.degreeName_hint')}
        >
          <Controller
            name="degreeName"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) =>
                  field.onChange(normalizeDegreeName(v ?? ''))
                }
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.degreeName)}
                options={DEGREE_OPTIONS.map((degree) => ({
                  value: degree,
                  label: degree,
                }))}
              />
            )}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('teachers.fields.annualNorm')}
            error={errors.annualNorm?.message}
          >
            <Input
              type="number"
              min={0}
              max={2000}
              {...register('annualNorm', { valueAsNumber: true })}
            />
          </Field>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300"
                {...register('isActive')}
              />
              {t('teachers.fields.isActive')}
            </label>
          </div>
        </div>

      </form>
    </Dialog>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
