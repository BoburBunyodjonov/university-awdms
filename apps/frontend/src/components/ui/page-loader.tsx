import { Spinner } from './spinner';

/**
 * Centred full-card loader for initial page fetches. Keeps layout height
 * stable so the page doesn't jump when data arrives.
 */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
      <Spinner size="lg" />
      {label ? <span className="text-xs text-zinc-500">{label}</span> : null}
    </div>
  );
}
