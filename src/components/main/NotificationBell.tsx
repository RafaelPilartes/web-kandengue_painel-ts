import { Bell } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/tailwind-merge'
import type { WorkNotification } from '@/modules/Api/rest/work.dao'
import { useAdminDirectory } from '@/viewModels/AccessViewModel'
import { useWorkNotifications } from '@/viewModels/WorkViewModel'

const VERB: Record<WorkNotification['kind'], string> = {
  task_assigned: 'atribuiu-lhe',
  task_status_changed: 'mudou o estado de',
  task_commented: 'comentou',
  task_due_soon: 'lembra o prazo de',
  checklist_assigned: 'deu-lhe um passo em'
}

const ago = (iso: string | null) => {
  if (!iso) return ''
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  if (minutes < 60 * 24) return `há ${Math.round(minutes / 60)} h`
  return `há ${Math.round(minutes / 60 / 24)} d`
}

/** The work module's notifications: who did what to which task. */
export function NotificationBell() {
  const { notifications, unread, markRead } = useWorkNotifications()
  const { byId } = useAdminDirectory()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={unread ? `Notificações, ${unread} por ler` : 'Notificações'}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/30 bg-gray-100/40 p-2 transition-colors hover:text-primary-200 dark:border-gray-500/60 dark:bg-gray-500/60"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-200 px-1 text-[0.6875rem] font-semibold tabular-nums text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[30] mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-light shadow-3xl dark:border-gray-700 dark:bg-dark">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm font-semibold text-dark dark:text-light">
              Notificações
            </p>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs font-medium text-primary-200 hover:underline"
                onClick={() => markRead.mutate([])}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Sem notificações. Quando lhe atribuírem ou comentarem uma tarefa,
              aparece aqui.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map(n => {
                const actor = byId.get(n.actor_id)?.name ?? 'Alguém'
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        markRead.mutate([n.id])
                        setOpen(false)
                        navigate(
                          `/work/tasks?task=${encodeURIComponent(n.task_id)}`
                        )
                      }}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700/60'
                      )}
                    >
                      <Avatar alt={actor} size="sm" />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          <strong className="font-semibold text-dark dark:text-light">
                            {actor}
                          </strong>{' '}
                          {VERB[n.kind]}{' '}
                          <span className="font-medium">
                            «{n.task_title || 'uma tarefa'}»
                          </span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {ago(n.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
