import type { ComponentProps, ReactNode } from 'react';
import { errorClass } from './field';

/** Checkbox row with a rich label + required marker (UI-SPEC §2). */
export function ConsentCheck({
  id,
  required,
  error,
  children,
  inputProps,
}: {
  id: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  inputProps: ComponentProps<'input'>;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20"
      >
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 rounded border-white/20 bg-white/5 accent-[var(--color-cyan)]"
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        <span className="text-sm leading-relaxed text-[var(--color-muted)]">
          {children}
          {required && <span className="ms-1 text-[var(--color-rose)]">*</span>}
        </span>
      </label>
      {error && (
        <p id={`${id}-error`} className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
