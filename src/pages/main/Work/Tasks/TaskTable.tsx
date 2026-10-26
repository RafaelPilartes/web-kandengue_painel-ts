import {
  WORK_TASK_PRIORITY_LABELS,
  WORK_TASK_STATUS_LABELS
} from '@rafaelpilartes/kandengue-shared-v4/constants'
import { Badge } from '@/components/ui/badge'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { formatDay, isOverdue, PRIORITY_TONE, useWorkContext } from '../shared'

export function TaskTable({
  tasks,
  onOpen
}: {
  tasks: WorkTask[]
  onOpen: (task: WorkTask) => void
}) {
  const ctx = useWorkContext()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
        <thead className="bg-gray-300/40 text-gray-700 dark:bg-gray-500/40 dark:text-gray-200">
          <tr>
            <th className="px-3 py-3 font-semibold">Tarefa</th>
            <th className="px-3 py-3 font-semibold">Departamento</th>
            <th className="px-3 py-3 font-semibold">Responsável</th>
            <th className="px-3 py-3 font-semibold">Prioridade</th>
            <th className="px-3 py-3 font-semibold">Estado</th>
            <th className="px-3 py-3 font-semibold">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr
              key={t.id}
              className="border-b border-gray-200 hover:bg-gray-100/60 dark:border-gray-700 dark:hover:bg-gray-700/40"
            >
              <td className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => onOpen(t)}
                  className="text-left font-medium text-dark hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 rounded dark:text-light"
                >
                  {t.title}
                </button>
              </td>
              <td className="px-3 py-3">
                {ctx.departmentName(t.department_id)}
              </td>
              <td className="px-3 py-3">{ctx.adminName(t.assignee_id)}</td>
              <td className="px-3 py-3">
                <Badge tone={PRIORITY_TONE[t.priority]}>
                  {WORK_TASK_PRIORITY_LABELS[t.priority]}
                </Badge>
              </td>
              <td className="px-3 py-3">{WORK_TASK_STATUS_LABELS[t.status]}</td>
              <td
                className={
                  isOverdue(t)
                    ? 'px-3 py-3 font-medium text-red-600 dark:text-red-400'
                    : 'px-3 py-3'
                }
              >
                {formatDay(t.due_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
