import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/tailwind-merge'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-200 text-white hover:bg-primary-400 active:bg-primary-600',
  secondary:
    'border border-gray-300 bg-light text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-dark dark:text-gray-100 dark:hover:bg-gray-700',
  ghost:
    'text-gray-700 hover:bg-gray-200/70 dark:text-gray-200 dark:hover:bg-gray-700',
  danger:
    'border border-primary-200/40 text-primary-300 hover:bg-primary-50 dark:text-primary-100 dark:hover:bg-primary-900/40'
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2'
}

/** The panel's one button. Variant says the role; `loading` blocks a second click. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 focus-visible:ring-offset-baseBgLight dark:focus-visible:ring-offset-baseBgDark',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
      {children}
    </button>
  )
}
