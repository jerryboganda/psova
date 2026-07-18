import type { ReactNode } from 'react';
import { labelClass, errorClass } from './field';

/**
 * Label + control + hint + error wrapper (UI-SPEC §2). The caller supplies the
 * actual control as children (input/select/textarea with the shared `fieldClass`),
 * wiring `aria-invalid` and `aria-describedby={`${id}-error`}` on it for a11y.
 */
export function FormField({
  id,
  label,
  required,
  optionalLabel,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="ms-1 text-[var(--color-rose)]">*</span>}
        {optionalLabel && !required && (
          <span className="ms-2 text-xs font-normal text-[var(--color-faint)]">
            ({optionalLabel})
          </span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--color-faint)]">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
