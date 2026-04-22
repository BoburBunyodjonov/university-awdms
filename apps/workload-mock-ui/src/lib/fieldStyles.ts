import { cn } from '@/lib/cn';

/** Ring + border for inputs inside the smart assignment modal */
export function fieldSurface(
  opts: { error?: boolean; warning?: boolean; disabled?: boolean } = {},
) {
  return cn(
    'rounded-xl border bg-white transition-shadow',
    opts.disabled && 'cursor-not-allowed opacity-60 bg-zinc-50',
    opts.error && 'border-red-400 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.35)]',
    opts.warning &&
      !opts.error &&
      'border-amber-400 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]',
    !opts.error &&
      !opts.warning &&
      !opts.disabled &&
      'border-zinc-200 focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-900/5',
  );
}
