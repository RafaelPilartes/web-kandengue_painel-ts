import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from 'react'
import { cn } from '@/lib/tailwind-merge'

const control =
  'w-full rounded-lg border border-gray-300 bg-light px-3 py-2 text-sm text-dark placeholder:text-gray-400 transition-colors ' +
  'focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-baseBgDark dark:text-light ' +
  'aria-[invalid=true]:border-red-500'

/** Label, control and message, wired for screen readers. */
function FieldShell({
  id,
  label,
  hint,
  error,
  children
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${id}-msg`}
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type Common = { label: string; hint?: string; error?: string }

export const TextField = forwardRef<
  HTMLInputElement,
  Common & InputHTMLAttributes<HTMLInputElement>
>(({ label, hint, error, className, id, ...props }, ref) => {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={cn(control, className)}
        {...props}
      />
    </FieldShell>
  )
})
TextField.displayName = 'TextField'

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  Common & TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ label, hint, error, className, id, ...props }, ref) => {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={cn(control, 'min-h-24', className)}
        {...props}
      />
    </FieldShell>
  )
})
TextAreaField.displayName = 'TextAreaField'

export const SelectField = forwardRef<
  HTMLSelectElement,
  Common &
    SelectHTMLAttributes<HTMLSelectElement> & {
      options: { value: string; label: string }[]
      placeholder?: string
    }
>(
  (
    { label, hint, error, className, id, options, placeholder, ...props },
    ref
  ) => {
    const auto = useId()
    const fieldId = id ?? auto
    return (
      <FieldShell id={fieldId} label={label} hint={hint} error={error}>
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
          className={cn(control, className)}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FieldShell>
    )
  }
)
SelectField.displayName = 'SelectField'
