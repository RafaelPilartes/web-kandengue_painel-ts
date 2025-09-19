// src/components/avatar.tsx
interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
  '3xl': 'w-28 h-28 text-3xl'
}

export function Avatar({ src, alt, fallback = '?', size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center relative rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span className="text-gray-600 dark:text-gray-300">{fallback}</span>
      )}
    </div>
  )
}
