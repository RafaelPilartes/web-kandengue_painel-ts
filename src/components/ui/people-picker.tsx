import { X } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/tailwind-merge'
import { Avatar } from './avatar'

export type PersonOption = {
  id: string
  name: string
  /** A second line: the department, usually. */
  hint?: string
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Choose several people: chips for who is in, a search box for who to add.
 * A combobox in the ARIA sense: arrows move, Enter adds, Backspace on an
 * empty box takes the last one out, Escape closes the list.
 */
export function PeoplePicker({
  label,
  options,
  value,
  onChange,
  disabled,
  max,
  hint,
  error,
  placeholder = 'Procurar pelo nome…'
}: {
  label: string
  options: PersonOption[]
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  max?: number
  hint?: string
  error?: string
  placeholder?: string
}) {
  const id = useId()
  const listId = `${id}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const byId = useMemo(() => new Map(options.map(o => [o.id, o])), [options])
  const full = max !== undefined && value.length >= max
  const matches = useMemo(() => {
    const q = normalize(query.trim())
    return options.filter(
      o =>
        !value.includes(o.id) &&
        (!q || normalize(`${o.name} ${o.hint ?? ''}`).includes(q))
    )
  }, [options, value, query])

  const add = (personId: string) => {
    if (full) return
    onChange([...value, personId])
    setQuery('')
    setActive(0)
    inputRef.current?.focus()
  }
  const remove = (personId: string) =>
    onChange(value.filter(v => v !== personId))

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive(a => Math.min(a + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      // Never submits the surrounding form from here.
      e.preventDefault()
      const pick = matches[active]
      if (open && pick) add(pick.id)
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'Backspace' && !query && value.length) {
      remove(value[value.length - 1])
    }
  }

  const showList = open && !disabled && !full
  const messageId = `${id}-msg`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
      </label>
      <div className="relative">
        <div
          className={cn(
            'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-light px-2 py-1.5 transition-colors',
            'focus-within:border-primary-200 focus-within:ring-2 focus-within:ring-primary-200/30',
            'dark:border-gray-600 dark:bg-baseBgDark',
            disabled && 'cursor-not-allowed opacity-60',
            error && 'border-red-500'
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {value.map(personId => {
            const person = byId.get(personId)
            const name = person?.name ?? 'Desconhecido'
            return (
              <span
                key={personId}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-1 text-sm text-dark dark:bg-gray-700 dark:text-light"
              >
                <Avatar alt={name} size="xs" />
                {name}
                {!disabled && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      remove(personId)
                    }}
                    aria-label={`Tirar ${name}`}
                    className="rounded-full p-0.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-light"
                  >
                    <X size={14} aria-hidden />
                  </button>
                )}
              </span>
            )
          })}
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              showList && matches[active]
                ? `${id}-opt-${matches[active].id}`
                : undefined
            }
            aria-invalid={!!error}
            aria-describedby={error || hint || full ? messageId : undefined}
            disabled={disabled || full}
            value={query}
            placeholder={
              full ? '' : value.length ? 'Juntar mais alguém…' : placeholder
            }
            onChange={e => {
              setQuery(e.target.value)
              setOpen(true)
              setActive(0)
            }}
            onFocus={() => setOpen(true)}
            // Lets a click on an option land before the list closes.
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-dark placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed dark:text-light"
          />
        </div>

        {showList && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-light py-1 shadow-lg shadow-gray-900/10 dark:border-gray-600 dark:bg-dark dark:shadow-black/40"
          >
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {query ? 'Ninguém com esse nome.' : 'Já estão todos.'}
              </li>
            ) : (
              matches.map((o, i) => (
                <li
                  key={o.id}
                  id={`${id}-opt-${o.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={e => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => add(o.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm',
                    i === active
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-transparent'
                  )}
                >
                  <Avatar alt={o.name} size="xs" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-dark dark:text-light">
                      {o.name}
                    </span>
                    {o.hint && (
                      <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {o.hint}
                      </span>
                    )}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error ? (
        <p id={messageId} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : full ? (
        <p id={messageId} className="text-xs text-gray-500 dark:text-gray-400">
          Chegou ao máximo de {max} pessoas.
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
