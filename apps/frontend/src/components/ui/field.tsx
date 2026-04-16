import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
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
