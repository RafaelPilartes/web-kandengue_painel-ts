import { Avatar } from './avatar'

/** The people on something, overlapped, with the rest counted. Names go in the tooltip and to screen readers. */
export function AvatarStack({
  names,
  max = 3,
  size = 'xs'
}: {
  names: string[]
  max?: number
  size?: 'xs' | 'sm'
}) {
  if (!names.length) return null
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  const ring =
    'ring-2 ring-light dark:ring-dark' + (size === 'xs' ? ' -ml-1' : ' -ml-1.5')
  return (
    <div
      className="flex items-center pl-1"
      title={names.join(', ')}
      aria-label={names.join(', ')}
      role="group"
    >
      {shown.map(name => (
        <Avatar key={name} alt={name} size={size} className={ring} />
      ))}
      {rest > 0 && (
        <span
          className={`${ring} flex ${size === 'xs' ? 'h-6 min-w-6 text-[0.625rem]' : 'h-8 min-w-8 text-xs'} items-center justify-center rounded-full bg-gray-200 px-1 font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200`}
        >
          +{rest}
        </span>
      )}
    </div>
  )
}
