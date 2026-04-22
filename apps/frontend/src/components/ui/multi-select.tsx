import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  value: string[];
  onValueChange: (next: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
  onBlur?: () => void;
  /** Shown in the list area when `options` is empty */
  emptyContent?: ReactNode;
  id?: string;
}

/**
 * Select-trigger styling + popover with checkboxes. Radix `Select` is
 * single-value only; this matches its look for multi pick.
 */
export function MultiSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  disabled,
  className,
  contentClassName,
  'aria-invalid': invalid,
  'aria-label': ariaLabel,
  onBlur,
  emptyContent,
  id: idProp,
}: MultiSelectProps) {
  const autoId = useId();
  const listId = `${autoId}-listbox`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerId = idProp ?? `${autoId}-trigger`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        onBlur?.();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, onBlur]);

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[];
  const summary =
    selectedLabels.length > 0 ? selectedLabels.join(', ') : null;

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onValueChange(value.filter((x) => x !== optValue));
    } else {
      onValueChange([...value, optValue]);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        className={cn(
          'inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1 text-left text-sm text-zinc-900 shadow-sm',
          'transition-colors',
          'hover:border-zinc-400',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          open && 'border-blue-500 ring-1 ring-blue-500/30',
          'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60',
          invalid && 'border-red-400 ring-1 ring-red-400/30',
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            !summary && 'text-zinc-400',
          )}
        >
          {summary ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-zinc-500 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={triggerId}
          className={cn(
            'absolute left-0 right-0 z-50 mt-1 max-h-[min(20rem,70vh)] overflow-hidden overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 text-sm text-zinc-900 shadow-lg',
            contentClassName,
          )}
        >
          {options.length === 0 ? (
            <div className="px-2 py-2 text-xs text-zinc-500">
              {emptyContent ?? '—'}
            </div>
          ) : (
            options.map((o) => {
              const checked = value.includes(o.value);
              return (
                <div
                  key={o.value}
                  role="option"
                  aria-selected={checked}
                  className={cn(
                    'flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 outline-none',
                    'hover:bg-blue-50 hover:text-blue-900',
                    o.disabled && 'pointer-events-none opacity-40',
                  )}
                  onClick={() => {
                    if (!o.disabled) toggle(o.value);
                  }}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-zinc-300 bg-white',
                    )}
                    aria-hidden
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{o.label}</div>
                    {o.description ? (
                      <div className="truncate text-[10px] text-zinc-500">
                        {o.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
