import { useState } from 'react'
import { cn } from '@/lib/tailwind-merge'

interface AvatarProps {
  src?: string
  alt?: string
  /** Shown without a photo, or when it fails to load. Defaults to the initials of `alt`. */
  fallback?: string
  size?: 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  className?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-[0.625rem]',
  sm: 'w-8 h-8 text-xs',
  base: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
  '3xl': 'w-28 h-28 text-3xl'
}

/*
 * Initials get a muted hue picked from the name, so the same person has the
 * same colour on every card, list and checklist. Six tones, none of them the
 * brand red, which stays for actions and state.
 */
const tints = [
  'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-100',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100',
  'bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-100',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/70 dark:text-violet-100',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-100',
  'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
]

const tintOf = (name = '') =>
  tints[
    [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) %
      tints.length
  ]

const initials = (name?: string) =>
  name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?'

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className
}: AvatarProps) {
  // A broken photo URL used to show the browser's broken-image glyph and alt text.
  const [failed, setFailed] = useState(false)
  const photo = src && !failed
  return (
    <div
      className={cn(
        sizeMap[size],
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        photo ? 'bg-gray-200 dark:bg-gray-700' : tintOf(alt),
        className
      )}
    >
      {photo ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span role="img" aria-label={alt} className="font-semibold">
          {fallback ?? initials(alt)}
        </span>
      )}
    </div>
  )
}
