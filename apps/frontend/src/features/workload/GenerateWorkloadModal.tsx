import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { useAcademicYears } from '@/features/academic-years/api';
import { useSubjectOfferings } from '@/features/subject-offerings/api';
import { useGenerateWorkload } from './api';
import { LIST_PAGE_SIZE_MAX } from '@/lib/pagination';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultAcademicYearId?: string;
}

export function GenerateWorkloadModal({
  open,
  onClose,
  defaultAcademicYearId,
}: Props) {
  const { t } = useTranslation();
  const { data: years } = useAcademicYears();
  const { data: offeringsList } = useSubjectOfferings({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
  });
  const generateMut = useGenerateWorkload();

  const [yearId, setYearId] = useState(defaultAcademicYearId ?? '');
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setYearId(
        defaultAcademicYearId ??
          years?.find((y) => y.isActive)?.id ??
          years?.[0]?.id ??
          '',
      );
      setSelected([]);
      setResult(null);
      setError(null);
    }
  }, [open, defaultAcademicYearId, years]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const selectAll = () =>
    setSelected(offeringsList?.items.map((o) => o.id) ?? []);
  const clear = () => setSelected([]);

  const onSubmit = async () => {
    if (!yearId) {
      setError(t('workload.generate.pick_year'));
      return;
    }
    setError(null);
    setResult(null);
    try {
      const res = await generateMut.mutateAsync({
        academicYearId: yearId,
        subjectOfferingIds: selected.length ? selected : undefined,
      });
      setResult(
        t('workload.generate.result', {
          created: res.createdCount,
          skipped: res.skippedCount,
        }),
      );
    } catch {
      /* hook toasts the error; inline "result" panel stays hidden */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('workload.generate.title')}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button
            onClick={onSubmit}
            loading={generateMut.isPending}
            disabled={!yearId}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t('workload.generate.run')}</span>
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={t('workload.generate.year')}>
          <Select
            value={yearId}
            onValueChange={(v) => setYearId(v ?? '')}
            placeholder={t('workload.generate.pick_year')}
            options={
              years?.map((y) => ({
                value: y.id,
                label: y.isActive ? `★ ${y.name}` : y.name,
              })) ?? []
            }
          />
        </Field>

        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-medium text-zinc-700">
              {t('workload.generate.offerings')}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={selectAll}
              >
                {t('workload.generate.select_all')}
              </button>
              <span className="text-zinc-300">|</span>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={clear}
              >
                {t('workload.generate.clear')}
              </button>
              <span className="text-zinc-500">
                ({selected.length}/{offeringsList?.items.length ?? 0})
              </span>
            </div>
          </div>
          <p className="mb-2 text-[11px] text-zinc-500">
            {t('workload.generate.hint')}
          </p>
          <div className="max-h-64 overflow-auto rounded-md border border-zinc-200 bg-white">
            <ul className="divide-y divide-zinc-100">
              {offeringsList?.items.map((o) => {
                const checked = selected.includes(o.id);
                return (
                  <li key={o.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm',
                        checked ? 'bg-blue-50' : 'hover:bg-zinc-50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-zinc-300"
                          checked={checked}
                          onChange={() => toggle(o.id)}
                        />
                        <span className="font-medium text-zinc-900">
                          {o.subject.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {o.subject.direction.code} · Y{o.courseYear} · S
                          {o.semesterNumber} ·{' '}
                          {t(`academicTerm.${o.academicTerm}`)}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {o.groupLinks.length} {t('offerings.fields.groups')}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {result ? (
          <div
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
            role="status"
          >
            {result}
          </div>
        ) : null}
        {error ? (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
