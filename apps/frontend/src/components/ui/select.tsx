import { type ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Radix Select forbids empty-string values (it uses '' internally for
// "no selection"). Our filters express "show all" as `undefined`, so a
// sentinel value carries that intent through the menu without leaking.
const CLEAR_SENTINEL = '__awdms_clear__';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  value: string | undefined | null;
  onValueChange: (value: string | undefined) => void;
  options: SelectOption[];
  placeholder?: string;
  /**
   * When true, a top-of-list item clears the selection (value → undefined).
   * Label defaults to `placeholder`.
   */
  clearable?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  triggerIcon?: ReactNode;
  name?: string;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
  onBlur?: () => void;
}

/**
 * Accessible Radix-backed select, styled with Tailwind. Keyboard-navigable
 * and screen-reader friendly out of the box. Focus/hover/open/disabled
 * states are driven by Radix `data-*` attributes.
 *
 * react-hook-form integration: wrap with <Controller render={({ field }) =>
 *   <Select value={field.value} onValueChange={field.onChange} ... />}/>.
 * register() does not work because Radix emits `onValueChange(string)`
 * instead of a DOM change event.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  clearable,
  clearLabel,
  disabled,
  className,
  contentClassName,
  triggerIcon,
  name,
  id,
  onBlur,
  ...aria
}: SelectProps) {
  const radixValue = value && value.length > 0 ? value : undefined;

  return (
    <RadixSelect.Root
      value={radixValue}
      onValueChange={(v) =>
        onValueChange(v === CLEAR_SENTINEL ? undefined : v)
      }
      disabled={disabled}
      name={name}
    >
      <RadixSelect.Trigger
        id={id}
        onBlur={onBlur}
        aria-invalid={aria['aria-invalid']}
        aria-label={aria['aria-label']}
        className={cn(
          'group inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 shadow-sm',
          'transition-colors',
          'hover:border-zinc-400',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          'data-[state=open]:border-blue-500 data-[state=open]:ring-1 data-[state=open]:ring-blue-500/30',
          'data-[placeholder]:text-zinc-400',
          'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60',
          'aria-invalid:border-red-400 aria-invalid:ring-1 aria-invalid:ring-red-400/30',
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
          {triggerIcon ? (
            <span className="shrink-0 text-zinc-500" aria-hidden="true">
              {triggerIcon}
            </span>
          ) : null}
          <span className="truncate">
            <RadixSelect.Value placeholder={placeholder ?? 'Select…'} />
          </span>
        </span>
        <RadixSelect.Icon asChild>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          className={cn(
            'z-50 max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 shadow-lg',
            contentClassName,
          )}
        >
          <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center bg-white text-zinc-400">
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1">
            {clearable ? (
              <RadixSelect.Item
                value={CLEAR_SENTINEL}
                className={cn(itemClasses, 'italic text-zinc-500')}
              >
                <RadixSelect.ItemText>
                  {clearLabel ?? placeholder ?? 'Clear'}
                </RadixSelect.ItemText>
              </RadixSelect.Item>
            ) : null}
            {options.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className={itemClasses}
              >
                {o.icon ? (
                  <span className="shrink-0 text-zinc-500" aria-hidden="true">
                    {o.icon}
                  </span>
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col">
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                  {o.description ? (
                    <span className="truncate text-[10px] text-zinc-500">
                      {o.description}
                    </span>
                  ) : null}
                </div>
                <RadixSelect.ItemIndicator className="ml-2 shrink-0 text-blue-600">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
            {options.length === 0 && !clearable ? (
              <div className="px-2 py-1.5 text-xs italic text-zinc-400">
                No options
              </div>
            ) : null}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center bg-white text-zinc-400">
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

const itemClasses = cn(
  'relative flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-sm outline-none',
  'data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900',
  'data-[state=checked]:font-medium',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
);
