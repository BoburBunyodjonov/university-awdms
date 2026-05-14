import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CreateAcademicYearSchema,
  type AcademicYear,
  type CreateAcademicYearInput,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  useCreateAcademicYear,
  useUpdateAcademicYear,
} from '@/features/academic-years/api';

interface Props {
  open: boolean;
  onClose: () => void;
  year?: AcademicYear | null;
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

const DEFAULTS: CreateAcademicYearInput = {
  name: '',
  isActive: false,
  startDate: '',
  endDate: '',
};

export function AcademicYearFormModal({ open, onClose, year }: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(year);
  const createMut = useCreateAcademicYear();
  const updateMut = useUpdateAcademicYear(year?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAcademicYearInput>({
    resolver: zodResolver(CreateAcademicYearSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      reset(
        year
          ? {
              name: year.name,
              isActive: year.isActive,
              startDate: toDateInput(year.startDate),
              endDate: toDateInput(year.endDate),
            }
          : DEFAULTS,
      );
    }
  }, [open, year, reset]);

  const onSubmit = async (values: CreateAcademicYearInput) => {
    try {
      if (isEditing) await updateMut.mutateAsync(values);
      else await createMut.mutateAsync(values);
      onClose();
    } catch {
      /* toasts in hooks */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        isEditing ? t('academicYears.edit_title') : t('academicYears.add_title')
      }
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="academic-year-form"
            loading={createMut.isPending || updateMut.isPending}
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="academic-year-form"
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field
          label={t('academicYears.fields.name')}
          hint={t('academicYears.fields.name_hint')}
          error={errors.name?.message}
        >
          <Input
            autoFocus
            placeholder="2026-2027"
            {...register('name')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('academicYears.fields.startDate')}
            error={errors.startDate?.message}
          >
            <Input type="date" {...register('startDate')} />
          </Field>
          <Field
            label={t('academicYears.fields.endDate')}
            error={errors.endDate?.message}
          >
            <Input type="date" {...register('endDate')} />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            {...register('isActive')}
          />
          {t('academicYears.fields.isActive')}
        </label>
      </form>
    </Dialog>
  );
}
