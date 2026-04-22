import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CreateFormulaConfigSchema,
  type CalculationMode,
  type CreateFormulaConfigInput,
  type FormulaConfig,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { useCreateFormula, useUpdateFormula } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  formula?: FormulaConfig | null;
}

const DEFAULTS: CreateFormulaConfigInput = {
  name: '',
  scopeType: 'lecture',
  level: 'bachelor',
  studyType: 'full_time',
  calculationMode: 'coefficient_based',
  baseHours: 0,
  coefficientPerStudent: 0,
  fixedHoursPerStudent: 0,
  fixedHoursPerGroup: 0,
  fixedValue: 0,
  isActive: true,
  effectiveFrom: new Date().toISOString().slice(0, 10),
};

// §4.5: calculation-mode-driven conditional fields. Only show the inputs that
// apply to the chosen mode so the form reflects the single numeric parameter
// each mode requires (enforced by CreateFormulaConfigSchema.superRefine).
const SCOPE_OPTIONS = [
  'lecture',
  'control',
  'practice',
  'lab',
  'course_project',
  'VQR_full_time',
  'VQR_part_time',
  'MD',
  'NDP',
  'NS',
] as const;

export function FormulaFormModal({ open, onClose, formula }: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(formula);
  const createMut = useCreateFormula();
  const updateMut = useUpdateFormula(formula?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateFormulaConfigInput>({
    resolver: zodResolver(CreateFormulaConfigSchema),
    defaultValues: DEFAULTS,
  });

  const mode = useWatch({ control, name: 'calculationMode' });

  useEffect(() => {
    if (open) {
      reset(
        formula
          ? {
              name: formula.name,
              scopeType: formula.scopeType,
              level: formula.level,
              studyType: formula.studyType,
              calculationMode: formula.calculationMode,
              baseHours: formula.baseHours,
              coefficientPerStudent: formula.coefficientPerStudent,
              fixedHoursPerStudent: formula.fixedHoursPerStudent,
              fixedHoursPerGroup: formula.fixedHoursPerGroup,
              fixedValue: formula.fixedValue,
              isActive: formula.isActive,
              effectiveFrom: formula.effectiveFrom.slice(0, 10),
            }
          : DEFAULTS,
      );
    }
  }, [open, formula, reset]);

  const onSubmit = async (values: CreateFormulaConfigInput) => {
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
      title={isEditing ? t('formulas.edit_title') : t('formulas.add_title')}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="formula-form"
            loading={createMut.isPending || updateMut.isPending}
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="formula-form"
        className="grid grid-cols-2 gap-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field
          label={t('formulas.fields.name')}
          error={errors.name?.message}
        >
          <Input autoFocus {...register('name')} />
        </Field>

        <Field
          label={t('formulas.fields.scopeType')}
          error={errors.scopeType?.message}
        >
          <Controller
            name="scopeType"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v)}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.scopeType)}
                options={SCOPE_OPTIONS.map((s) => ({
                  value: s,
                  label: t(`workloadType.${s}`),
                }))}
              />
            )}
          />
        </Field>

        <Field
          label={t('formulas.fields.level')}
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

        <Field
          label={t('formulas.fields.studyType')}
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
          label={t('formulas.fields.calculationMode')}
          error={errors.calculationMode?.message}
        >
          <Controller
            name="calculationMode"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v)}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.calculationMode)}
                options={(
                  [
                    'coefficient_based',
                    'fixed_per_student',
                    'fixed_per_group',
                    'fixed_value',
                  ] as const
                ).map((m) => ({
                  value: m,
                  label: t(`calculationMode.${m}`),
                }))}
              />
            )}
          />
        </Field>

        <Field
          label={t('formulas.fields.effectiveFrom')}
          error={errors.effectiveFrom?.message}
        >
          <Input type="date" {...register('effectiveFrom')} />
        </Field>

        {/* Mode-specific numeric inputs (§4.5 superRefine validates these). */}
        {mode === 'coefficient_based' ? (
          <>
            <Field
              label={t('formulas.fields.baseHours')}
              error={errors.baseHours?.message}
              hint={t('formulas.fields.baseHours_hint')}
            >
              <Input
                type="number"
                step="0.1"
                min="0"
                {...register('baseHours', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label={t('formulas.fields.coefficientPerStudent')}
              error={errors.coefficientPerStudent?.message}
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('coefficientPerStudent', { valueAsNumber: true })}
              />
            </Field>
          </>
        ) : null}

        {mode === 'fixed_per_student' ? (
          <Field
            label={t('formulas.fields.fixedHoursPerStudent')}
            error={errors.fixedHoursPerStudent?.message}
            hint={t('formulas.fields.fixedHoursPerStudent_hint')}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('fixedHoursPerStudent', { valueAsNumber: true })}
            />
          </Field>
        ) : null}

        {mode === 'fixed_per_group' ? (
          <Field
            label={t('formulas.fields.fixedHoursPerGroup')}
            error={errors.fixedHoursPerGroup?.message}
          >
            <Input
              type="number"
              step="0.1"
              min="0"
              {...register('fixedHoursPerGroup', { valueAsNumber: true })}
            />
          </Field>
        ) : null}

        {mode === 'fixed_value' ? (
          <Field
            label={t('formulas.fields.fixedValue')}
            error={errors.fixedValue?.message}
            hint={t('formulas.fields.fixedValue_hint')}
          >
            <Input
              type="number"
              step="0.1"
              min="0"
              {...register('fixedValue', { valueAsNumber: true })}
            />
          </Field>
        ) : null}

        <label className="col-span-2 flex items-center gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            {...register('isActive')}
          />
          {t('formulas.fields.isActive')}
        </label>

      </form>
    </Dialog>
  );
}

// tiny helper so the calculation-mode option list stays typed
export const CALC_MODES: readonly CalculationMode[] = [
  'coefficient_based',
  'fixed_per_student',
  'fixed_per_group',
  'fixed_value',
] as const;
