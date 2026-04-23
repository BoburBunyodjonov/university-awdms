import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Languages, Users } from 'lucide-react';
import {
  CreateLectureStreamSchema,
  type CreateLectureStreamInput,
  type Language,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { useSubjectOfferings } from '@/features/subject-offerings/api';
import { api } from '@/lib/api';
import { LIST_PAGE_SIZE_MAX } from '@/lib/pagination';
import { useQuery } from '@tanstack/react-query';
import {
  useCreateStream,
  useUpdateStream,
  type StreamWithRelations,
} from './api';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  stream?: StreamWithRelations | null;
}

const DEFAULTS: CreateLectureStreamInput = {
  subjectOfferingId: '',
  language: 'uzbek',
  groupIds: [],
  teacherId: null,
  status: 'draft',
};

// When the user selects a subject offering we need the groups linked to that
// offering. We hit GET /subject-offerings/:id for that — the response already
// includes groupLinks[].group with language, studentCount, courseYear.
interface OfferingGroupLink {
  groupId: string;
  group: {
    id: string;
    name: string;
    language: Language;
    studentCount: number;
    courseYear: number;
  };
}

interface OfferingDetail {
  id: string;
  subject: { name: string; code: string | null; level: string };
  groupLinks: OfferingGroupLink[];
}

export function LectureStreamFormModal({ open, onClose, stream }: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(stream);
  const createMut = useCreateStream();
  const updateMut = useUpdateStream(stream?.id ?? '');

  const { data: offeringsList } = useSubjectOfferings({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateLectureStreamInput>({
    resolver: zodResolver(CreateLectureStreamSchema),
    defaultValues: DEFAULTS,
  });

  const offeringId = useWatch({ control, name: 'subjectOfferingId' });
  const language = useWatch({ control, name: 'language' });
  const selectedGroupIds = useWatch({ control, name: 'groupIds' }) ?? [];

  // Pull the offering detail once the user picks one. Includes the full set
  // of candidate groups — no separate /groups call needed.
  const { data: offeringDetail } = useQuery<OfferingDetail>({
    enabled: Boolean(offeringId),
    queryKey: ['offering-detail', offeringId],
    queryFn: async () => {
      const { data } = await api.get<OfferingDetail>(
        `/subject-offerings/${offeringId}`,
      );
      return data;
    },
  });

  const candidateGroups = offeringDetail?.groupLinks.map((l) => l.group) ?? [];

  // The first group picked locks the language. Any subsequent group with a
  // different language is shown but disabled — so the user understands *why*
  // they can't pick it.
  const firstPickedLanguage: Language | null = useMemo(() => {
    if (!selectedGroupIds.length) return null;
    const first = candidateGroups.find((g) =>
      selectedGroupIds.includes(g.id),
    );
    return first?.language ?? null;
  }, [selectedGroupIds, candidateGroups]);

  // Sync the form's `language` field to whichever the first group has.
  useEffect(() => {
    if (firstPickedLanguage && firstPickedLanguage !== language) {
      setValue('language', firstPickedLanguage, { shouldValidate: false });
    }
  }, [firstPickedLanguage, language, setValue]);

  const totalStudents = useMemo(
    () =>
      candidateGroups
        .filter((g) => selectedGroupIds.includes(g.id))
        .reduce((n, g) => n + g.studentCount, 0),
    [candidateGroups, selectedGroupIds],
  );

  useEffect(() => {
    if (open) {
      reset(
        stream
          ? {
              subjectOfferingId: stream.subjectOffering.id,
              language: stream.language,
              groupIds: stream.groupLinks.map((l) => l.groupId),
              teacherId: stream.teacher?.id ?? null,
              status: stream.status,
            }
          : DEFAULTS,
      );
    }
  }, [open, stream, reset]);

  // Switching the offering invalidates the current group selection, since
  // groups are offering-scoped.
  useEffect(() => {
    if (!isEditing && offeringId) {
      setValue('groupIds', [], { shouldDirty: true });
    }
  }, [offeringId, isEditing, setValue]);

  const toggleGroup = (groupId: string, disabled: boolean) => {
    if (disabled) return;
    const next = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((id) => id !== groupId)
      : [...selectedGroupIds, groupId];
    setValue('groupIds', next, { shouldDirty: true });
  };

  const onSubmit = async (values: CreateLectureStreamInput) => {
    try {
      if (isEditing) {
        await updateMut.mutateAsync({
          language: values.language,
          groupIds: values.groupIds,
          teacherId: values.teacherId ?? null,
          status: values.status,
        });
      } else {
        await createMut.mutateAsync({
          ...values,
          status: 'draft',
        });
      }
      onClose();
    } catch {
      /* hook toasts the error; keep modal open */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? t('streams.edit_title') : t('streams.add_title')}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="stream-form"
            loading={createMut.isPending || updateMut.isPending}
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="stream-form"
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('streams.fields.offering')}
            error={errors.subjectOfferingId?.message}
          >
            <Controller
              name="subjectOfferingId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? '')}
                  onBlur={field.onBlur}
                  disabled={isEditing}
                  aria-invalid={Boolean(errors.subjectOfferingId)}
                  placeholder={t('streams.pick_offering')}
                  options={
                    offeringsList?.items.map((o) => ({
                      value: o.id,
                      label: o.subject.name,
                      description: `${o.subject.direction.code} · Y${o.courseYear} · S${o.semesterNumber} · ${t(`academicTerm.${o.academicTerm}`)}`,
                    })) ?? []
                  }
                />
              )}
            />
          </Field>
          {isEditing ? (
            <Field
              label={t('streams.fields.status')}
              error={errors.status?.message}
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.status)}
                    options={[
                      { value: 'draft', label: t('status.draft') },
                      { value: 'ready', label: t('status.ready') },
                      { value: 'assigned', label: t('status.assigned') },
                    ]}
                  />
                )}
              />
            </Field>
          ) : null}
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-medium text-zinc-700">
              {t('streams.fields.groups')}
            </span>
            <div className="flex items-center gap-3 text-xs text-zinc-600">
              {firstPickedLanguage ? (
                <span className="inline-flex items-center gap-1">
                  <Languages className="h-3 w-3" aria-hidden="true" />
                  <span>
                    {t('streams.locked_language', {
                      lang: t(`language.${firstPickedLanguage}`),
                    })}
                  </span>
                </span>
              ) : (
                <span className="text-zinc-500">
                  {t('streams.pick_first_hint')}
                </span>
              )}
            </div>
          </div>

          {!offeringId ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
              {t('streams.pick_offering_first')}
            </div>
          ) : !candidateGroups.length ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
              {t('streams.no_groups')}
            </div>
          ) : (
            <div className="max-h-64 overflow-auto rounded-md border border-zinc-200 bg-white">
              <ul className="divide-y divide-zinc-100">
                {candidateGroups.map((g) => {
                  const checked = selectedGroupIds.includes(g.id);
                  const disabled =
                    firstPickedLanguage !== null &&
                    g.language !== firstPickedLanguage &&
                    !checked;
                  return (
                    <li key={g.id}>
                      <label
                        className={cn(
                          'flex items-center justify-between gap-2 px-3 py-1.5 text-sm',
                          disabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer',
                          checked ? 'bg-blue-50' : 'hover:bg-zinc-50',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-300"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleGroup(g.id, disabled)}
                          />
                          <span className="font-medium text-zinc-900">
                            {g.name}
                          </span>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-1.5 py-0.5 text-[10px]',
                              g.language === 'uzbek'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-sky-200 bg-sky-50 text-sky-800',
                            )}
                          >
                            {t(`language.${g.language}`)}
                          </span>
                          {disabled ? (
                            <span className="text-[10px] text-red-600">
                              {t('streams.different_language')}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs text-zinc-500">
                          Y{g.courseYear} · {g.studentCount}{' '}
                          {t('offerings.students_short')}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {errors.groupIds ? (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.groupIds.message as string}
            </p>
          ) : null}

          {selectedGroupIds.length > 0 ? (
            <div className="mt-2 flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm">
              <span className="inline-flex items-center gap-1.5 text-zinc-700">
                <Users className="h-4 w-4" aria-hidden="true" />
                {t('streams.total_students', { count: totalStudents })}
              </span>
              <span className="text-xs text-zinc-500">
                {t('streams.group_count', { count: selectedGroupIds.length })}
              </span>
            </div>
          ) : null}
        </div>

        <input type="hidden" {...register('language')} />

      </form>
    </Dialog>
  );
}
