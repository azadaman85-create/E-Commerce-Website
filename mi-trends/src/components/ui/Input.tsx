"use client";

import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    floating: boolean;
    onFocus: () => void;
    onBlur: () => void;
    setFilled: (v: boolean) => void;
  }) => React.ReactNode;
}

/**
 * Shared floating-label shell. The label starts inside the field and
 * animates up when the field is focused or holds a value — we never fall
 * back to placeholder text, which disappears once typing starts.
 */
function FieldShell({
  label,
  error,
  hint,
  required,
  className,
  children,
}: FieldShellProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [filled, setFilled] = useState(false);
  const floating = focused || filled;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {children({
          id,
          floating,
          onFocus: () => setFocused(true),
          onBlur: () => setFocused(false),
          setFilled,
        })}
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-4 origin-left bg-white px-1",
            "transition-all duration-200 ease-premium",
            floating
              ? "top-0 -translate-y-1/2 text-caption uppercase tracking-[0.1em]"
              : "top-1/2 -translate-y-1/2 text-body-sm",
            error ? "text-danger" : floating ? "text-accent" : "text-muted",
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      </div>
      {error ? (
        <p className="mt-2 text-caption text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-caption text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const controlBase =
  "w-full rounded-sm border bg-white px-4 text-body-sm text-ink " +
  "transition-colors duration-200 placeholder:text-transparent";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, required, onFocus, onBlur, onChange, ...props },
  ref,
) {
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      {({ id, onFocus: shellFocus, onBlur: shellBlur, setFilled }) => (
        <input
          {...props}
          ref={ref}
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          onFocus={(e) => {
            shellFocus();
            onFocus?.(e);
          }}
          onBlur={(e) => {
            shellBlur();
            setFilled(Boolean(e.target.value));
            onBlur?.(e);
          }}
          onChange={(e) => {
            setFilled(Boolean(e.target.value));
            onChange?.(e);
          }}
          className={cn(
            controlBase,
            "h-14",
            error
              ? "border-danger focus:border-danger"
              : "border-ink/15 focus:border-accent",
          )}
        />
      )}
    </FieldShell>
  );
});

interface TextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "id" | "className"
  > {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, hint, className, required, onFocus, onBlur, onChange, rows = 5, ...props },
    ref,
  ) {
    return (
      <FieldShell
        label={label}
        error={error}
        hint={hint}
        required={required}
        className={className}
      >
        {({ id, onFocus: shellFocus, onBlur: shellBlur, setFilled }) => (
          <textarea
            {...props}
            ref={ref}
            id={id}
            rows={rows}
            required={required}
            aria-invalid={Boolean(error)}
            onFocus={(e) => {
              shellFocus();
              onFocus?.(e);
            }}
            onBlur={(e) => {
              shellBlur();
              setFilled(Boolean(e.target.value));
              onBlur?.(e);
            }}
            onChange={(e) => {
              setFilled(Boolean(e.target.value));
              onChange?.(e);
            }}
            className={cn(
              controlBase,
              "resize-y py-4",
              error
                ? "border-danger focus:border-danger"
                : "border-ink/15 focus:border-accent",
            )}
          />
        )}
      </FieldShell>
    );
  },
);

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

/** Selects always show their label floated — a select is never visually empty. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, required, children, ...props },
  ref,
) {
  const id = useId();
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <select
          {...props}
          ref={ref}
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(
            controlBase,
            "h-14 cursor-pointer appearance-none pr-10",
            error
              ? "border-danger focus:border-danger"
              : "border-ink/15 focus:border-accent",
          )}
        >
          {children}
        </select>
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-4 top-0 -translate-y-1/2 bg-white px-1",
            "text-caption uppercase tracking-[0.1em]",
            error ? "text-danger" : "text-muted",
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error ? (
        <p className="mt-2 text-caption text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-caption text-muted">{hint}</p>
      ) : null}
    </div>
  );
});

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label: React.ReactNode;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, className, ...props }, ref) {
    const id = useId();
    return (
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer select-none items-center gap-3 text-body-sm text-ink",
          className,
        )}
      >
        <input
          {...props}
          ref={ref}
          id={id}
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded-[2px] border-ink/25 text-accent accent-accent"
        />
        <span>{label}</span>
      </label>
    );
  },
);
