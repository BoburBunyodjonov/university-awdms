import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { useCreateTeacher, useUpdateTeacher } from './api';

interface TeacherFormModalProps {
  open: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
}

const DEFAULTS: CreateTeacherInput = {
  fullName: '',
  degreeName: '',
  hasScientificDegree: false,
  position: '',
  annualNorm: 850,
  isActive: true,
};

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
              degreeName: teacher.degreeName,
              hasScientificDegree: teacher.hasScientificDegree,
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
    try {
      if (isEditing) await updateMut.mutateAsync(values);
      else await createMut.mutateAsync(values);
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
          <Input {...register('degreeName')} />
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
                {...register('hasScientificDegree')}
              />
              {t('teachers.fields.hasScientificDegree')}
            </label>
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
