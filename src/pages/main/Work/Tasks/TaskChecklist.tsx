import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/tailwind-merge'
import type { WorkChecklistItem, WorkTask } from '@/modules/Api/rest/work.dao'
import { showToast } from '@/utils/toasts'
import { useTaskSteps } from '@/viewModels/WorkViewModel'
import { stepProgress, useWorkContext } from '../shared'

const ANYONE = ''

const formatWhen = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('pt-AO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Luanda'
      }).format(new Date(iso))
    : ''

export function ProgressBar({
  done,
  total,
  label
}: {
  done: number
  total: number
  label: string
}) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          pct === 100 ? 'bg-emerald-500' : 'bg-primary-200'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * What each person on the task does. The steps are grouped by person, the
 * admin's own group first, so opening a task answers "what is mine here".
 */
export function TaskChecklist({ task }: { task: WorkTask }) {
  const ctx = useWorkContext()
  const steps = useTaskSteps(task.id)
  const canEdit = ctx.canEdit(task)
  const [text, setText] = useState('')
  const [person, setPerson] = useState(
    task.assignee_ids.includes(ctx.meId)
      ? ctx.meId
      : (task.assignee_ids[0] ?? ANYONE)
  )

  const { done, total } = stepProgress(task)
  const people = [...task.assignee_ids].sort(
    (a, b) => Number(b === ctx.meId) - Number(a === ctx.meId)
  )
  const groups: { id: string | null; items: WorkChecklistItem[] }[] = [
    ...people.map(id => ({
      id,
      items: task.checklist.filter(i => i.assignee_id === id)
    })),
    { id: null, items: task.checklist.filter(i => i.assignee_id === null) }
  ].filter(g => g.items.length > 0 || (canEdit && g.id !== null))

  async function addStep(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await steps.add.mutateAsync({
        text: text.trim(),
        assignee_id: person || null
      })
      setText('')
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  return (
    <section
      aria-labelledby={`checklist-${task.id}`}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            id={`checklist-${task.id}`}
            className="text-sm font-semibold text-dark dark:text-light"
          >
            Quem faz o quê
          </h3>
          {total > 0 && (
            <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
              {done} de {total} feitos
            </span>
          )}
        </div>
        {total > 0 && (
          <ProgressBar done={done} total={total} label="Passos feitos" />
        )}
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ainda sem passos. Quem gere a tarefa divide-a aqui, pessoa a pessoa.
        </p>
      )}

      {groups.map(group => {
        const name = group.id ? ctx.adminName(group.id) : 'Qualquer pessoa'
        const groupDone = group.items.filter(i => i.done).length
        return (
          <div key={group.id ?? 'anyone'} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {group.id ? (
                <Avatar alt={name} size="xs" />
              ) : (
                <span className="h-6 w-6 rounded-full border border-dashed border-gray-400 dark:border-gray-500" />
              )}
              <span className="text-sm font-medium text-dark dark:text-light">
                {name}
                {group.id === ctx.meId && (
                  <span className="font-normal text-gray-500 dark:text-gray-400">
                    {' '}
                    (você)
                  </span>
                )}
              </span>
              {group.items.length > 0 && (
                <span className="ml-auto text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {groupDone}/{group.items.length}
                </span>
              )}
            </div>
            {group.items.length === 0 ? (
              <p className="py-1 pl-8 text-xs text-gray-500 dark:text-gray-400">
                Ainda sem passos para esta pessoa.
              </p>
            ) : (
              <ul className="flex flex-col">
                {group.items.map(item => (
                  <StepRow
                    key={item.id}
                    item={item}
                    task={task}
                    canEdit={canEdit}
                    steps={steps}
                  />
                ))}
              </ul>
            )}
          </div>
        )
      })}

      {canEdit && (
        <form
          onSubmit={addStep}
          className="flex flex-col gap-2 rounded-lg border border-gray-200 p-2 sm:flex-row sm:items-center dark:border-gray-600"
        >
          <label className="sr-only" htmlFor={`new-step-${task.id}`}>
            Novo passo
          </label>
          <input
            id={`new-step-${task.id}`}
            value={text}
            maxLength={300}
            onChange={e => setText(e.target.value)}
            placeholder="Novo passo, ex.: testar o login por telefone"
            className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1.5 text-sm text-dark placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200/40 dark:text-light"
          />
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`new-step-person-${task.id}`}>
              Para quem
            </label>
            <select
              id={`new-step-person-${task.id}`}
              value={person}
              onChange={e => setPerson(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-gray-300 bg-light px-2 py-1.5 text-sm text-dark focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200/30 sm:w-40 sm:flex-none dark:border-gray-600 dark:bg-baseBgDark dark:text-light"
            >
              {task.assignee_ids.map(id => (
                <option key={id} value={id}>
                  {ctx.adminName(id)}
                </option>
              ))}
              <option value={ANYONE}>Qualquer pessoa</option>
            </select>
            <Button
              type="submit"
              size="sm"
              icon={<Plus size={16} aria-hidden />}
              loading={steps.add.isPending}
              disabled={!text.trim()}
            >
              Adicionar
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

function StepRow({
  item,
  task,
  canEdit,
  steps
}: {
  item: WorkChecklistItem
  task: WorkTask
  canEdit: boolean
  steps: ReturnType<typeof useTaskSteps>
}) {
  const ctx = useWorkContext()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)
  const [owner, setOwner] = useState(item.assignee_id ?? ANYONE)
  const checkboxId = `step-${item.id}`

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    try {
      await steps.edit.mutateAsync({
        itemId: item.id,
        values: {
          ...(draft.trim() !== item.text ? { text: draft.trim() } : {}),
          ...((owner || null) !== item.assignee_id
            ? { assignee_id: owner || null }
            : {})
        }
      })
      setEditing(false)
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  async function toggle(done: boolean) {
    try {
      await steps.toggle.mutateAsync({ itemId: item.id, done })
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  async function remove() {
    try {
      await steps.remove.mutateAsync(item.id)
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  if (editing)
    return (
      <li className="py-1 pl-8">
        <form onSubmit={save} className="flex flex-col gap-2">
          <input
            value={draft}
            maxLength={300}
            autoFocus
            aria-label="Texto do passo"
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                setEditing(false)
              }
            }}
            className="w-full rounded-md border border-gray-300 bg-light px-2 py-1.5 text-sm text-dark focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200/30 dark:border-gray-600 dark:bg-baseBgDark dark:text-light"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={owner}
              aria-label="Para quem"
              onChange={e => setOwner(e.target.value)}
              className="rounded-md border border-gray-300 bg-light px-2 py-1 text-sm text-dark dark:border-gray-600 dark:bg-baseBgDark dark:text-light"
            >
              {task.assignee_ids.map(id => (
                <option key={id} value={id}>
                  {ctx.adminName(id)}
                </option>
              ))}
              <option value={ANYONE}>Qualquer pessoa</option>
            </select>
            <Button
              type="submit"
              size="sm"
              icon={<Check size={14} aria-hidden />}
              loading={steps.edit.isPending}
            >
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<X size={14} aria-hidden />}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    )

  return (
    <li className="group -mx-2 flex items-start gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/40">
      {/* The forms plugin paints a checked box with currentColor and draws the tick. */}
      <input
        id={checkboxId}
        type="checkbox"
        checked={item.done}
        onChange={e => toggle(e.target.checked)}
        className="ml-1.5 mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-400 bg-light text-emerald-600 focus:ring-2 focus:ring-primary-200 focus:ring-offset-1 dark:border-gray-500 dark:bg-baseBgDark dark:text-emerald-500 dark:focus:ring-offset-dark"
      />
      <label
        htmlFor={checkboxId}
        className="flex min-w-0 flex-1 cursor-pointer flex-col"
      >
        <span
          className={cn(
            'text-sm [text-wrap:pretty]',
            item.done
              ? 'text-gray-500 line-through decoration-gray-400 dark:text-gray-400'
              : 'text-dark dark:text-light'
          )}
        >
          {item.text}
        </span>
        {item.done && item.done_by && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Feito por {ctx.adminName(item.done_by)} · {formatWhen(item.done_at)}
          </span>
        )}
      </label>
      {canEdit && (
        <div className="flex shrink-0 gap-0.5 md:opacity-0 md:transition-opacity md:focus-within:opacity-100 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => {
              setDraft(item.text)
              setOwner(item.assignee_id ?? ANYONE)
              setEditing(true)
            }}
            aria-label={`Editar o passo: ${item.text}`}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-light"
          >
            <Pencil size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={remove}
            aria-label={`Tirar o passo: ${item.text}`}
            className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 dark:text-gray-400 dark:hover:bg-red-900/40 dark:hover:text-red-300"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      )}
    </li>
  )
}
