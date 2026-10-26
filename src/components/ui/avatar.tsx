import { useState } from 'react'

interface AvatarProps {
  src?: string
  alt?: string
  /** Shown without a photo, or when it fails to load. Defaults to the initials of `alt`. */
  fallback?: string
  size?: 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  base: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
  '3xl': 'w-28 h-28 text-3xl'
}

const initials = (name?: string) =>
  name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?'

export function Avatar({ src, alt, fallback, size = 'md' }: AvatarProps) {
  // A broken photo URL used to show the browser's broken-image glyph and alt text.
  const [failed, setFailed] = useState(false)
  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center relative rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span
          aria-label={alt}
          className="font-semibold text-gray-600 dark:text-gray-300"
        >
          {fallback ?? initials(alt)}
        </span>
      )}
    </div>
  )
}
