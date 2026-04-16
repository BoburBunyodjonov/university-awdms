import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, CircleSlash, Pencil, Plus, Trash2 } from 'lucide-react';
import type {
  CalculationMode,
  FormulaConfig,
  FormulaScope,
  StudyLevel,
} from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DataTable, Td, Th } from '@/components/ui/table';
import {
  useDeleteFormula,
  useFormulas,
  type FormulasQuery,
} from '@/features/formulas/api';
import { FormulaFormModal } from '@/features/formulas/FormulaFormModal';
import { cn } from '@/lib/utils';

const parameterCell = (f: FormulaConfig): string => {
  switch (f.calculationMode) {
    case 'coefficient_based':
      return `base ${f.baseHours}h + ${f.coefficientPerStudent}×students`;
    case 'fixed_per_student':
      return `${f.fixedHoursPerStudent}h × students`;
    case 'fixed_per_group':
      return `${f.fixedHoursPerGroup}h × groups`;
    case 'fixed_value':
      return `${f.fixedValue}h`;
  }
};

export function FormulasPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<FormulasQuery>({});
  const [editing, setEditing] = useState<FormulaConfig | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useFormulas(query);
  const deleteMut = useDeleteFormula();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (f: FormulaConfig) => {
    setEditing(f);
    setModalOpen(true);
  };
  const handleDelete = async (f: FormulaConfig) => {
    if (!confirm(t('formulas.confirm_delete', { name: f.name }))) return;
    await deleteMut.mutateAsync(f.id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.formulas')}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('formulas.add')}</span>
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        empty={data && data.items.length === 0 ? t('common.empty') : undefined}
        toolbar={
          <>
            <Select
              className="w-44"
              value={query.scopeType}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  scopeType: v as FormulaScope | undefined,
                }))
              }
              placeholder={t('formulas.all_scopes')}
              clearable
              options={(
                [
                  'lecture',
                  'control',
                  'practice',
                  'lab',
                  'course_project',
                  'VQR',
                  'MD',
                  'NDP',
                  'NS',
                ] as const
              ).map((s) => ({
                value: s,
                label: t(`workloadType.${s}`),
              }))}
            />
            <Select
              className="w-36"
              value={query.level}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  level: v as StudyLevel | undefined,
                }))
              }
              placeholder={t('directions.all_levels')}
              clearable
              options={[
                { value: 'bachelor', label: t('level.bachelor') },
                { value: 'master', label: t('level.master') },
              ]}
            />
          </>
        }
        footer={
          data ? (
            <span>
              {data.total} {t('formulas.total_suffix')}
            </span>
          ) : null
        }
      >
        <thead>
          <tr>
            <Th>{t('formulas.fields.name')}</Th>
            <Th>{t('formulas.fields.scopeType')}</Th>
            <Th>{t('formulas.fields.context')}</Th>
            <Th>{t('formulas.fields.calculationMode')}</Th>
            <Th>{t('formulas.fields.parameters')}</Th>
            <Th>{t('formulas.fields.effectiveFrom')}</Th>
            <Th>{t('formulas.fields.status')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((f) => (
            <tr key={f.id} className="hover:bg-zinc-50">
              <Td className="font-medium text-zinc-900">{f.name}</Td>
              <Td>
                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700">
                  {t(`workloadType.${f.scopeType}`)}
                </span>
              </Td>
              <Td className="text-zinc-700 text-xs">
                {t(`level.${f.level}`)} / {t(`studyType.${f.studyType}`)}
              </Td>
              <Td className="text-zinc-700 text-xs">
                {t(`calculationMode.${f.calculationMode as CalculationMode}`)}
              </Td>
              <Td className="font-mono text-xs text-zinc-700">
                {parameterCell(f)}
              </Td>
              <Td className="text-xs text-zinc-700">
                {f.effectiveFrom.slice(0, 10)}
              </Td>
              <Td>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs',
                    f.isActive ? 'text-emerald-700' : 'text-zinc-500',
                  )}
                >
                  {f.isActive ? (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <CircleSlash className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {f.isActive ? t('teachers.status_active') : t('teachers.status_inactive')}
                </span>
              </Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(f)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('common.edit')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(f)}
                    className="text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('common.delete')}</span>
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <FormulaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        formula={editing}
      />
    </div>
  );
}
