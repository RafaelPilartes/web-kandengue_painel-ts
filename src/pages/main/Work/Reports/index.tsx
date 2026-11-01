import { BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectField } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { Panel } from '@/components/ui/panel'
import { useWorkReport } from '@/viewModels/WorkViewModel'
import { useWorkContext } from '../shared'

const SEGMENTS = [
  ['todo', 'A fazer', 'bg-gray-400'],
  ['in_progress', 'Em curso', 'bg-sky-500'],
  ['review', 'Em revisão', 'bg-amber-500'],
  ['done', 'Feito', 'bg-emerald-500']
] as const

/** Where the work stands, per department and per person. Direction sees all; a manager their department. */
export function WorkReportsPage() {
  const ctx = useWorkContext()
  const [departmentId, setDepartmentId] = useState('')
  const scope =
    ctx.workScope === 'all'
      ? departmentId || undefined
      : (ctx.myDepartment ?? undefined)
  const { report, isLoading, isError } = useWorkReport(scope, ctx.canSeeReports)

  if (!ctx.canSeeReports) {
    return (
      <Panel>
        <EmptyState
          icon={<BarChart3 size={36} />}
          title="Os relatórios são para a Direcção e os Gestores"
          description="As suas tarefas estão em Tarefas e no Calendário."
        />
      </Panel>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Relatórios de trabalho"
        description="Quanto há por fazer, o que está atrasado e quem tem mais em mãos."
        actions={
          ctx.workScope === 'all' && (
            <div className="w-64">
              <SelectField
                label="Departamento"
                value={departmentId}
                placeholder="Todos"
                options={ctx.departments.map(d => ({
                  value: d.id,
                  label: d.name
                }))}
                onChange={e => setDepartmentId(e.target.value)}
              />
            </div>
          )
        }
      />

      {isLoading ? (
        <Panel>
          <p className="py-10 text-center text-sm text-gray-500">A calcular…</p>
        </Panel>
      ) : isError || !report ? (
        <Panel>
          <EmptyState
            title="Não foi possível carregar os relatórios"
            description="Tente outra vez dentro de momentos."
          />
        </Panel>
      ) : report.by_department.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<BarChart3 size={36} />}
            title="Sem tarefas para relatar"
            description="Os números aparecem quando houver tarefas."
          />
        </Panel>
      ) : (
        <>
          <Panel title="Por departamento">
            <ul className="flex flex-col gap-4">
              {report.by_department.map(d => {
                const total = d.todo + d.in_progress + d.review + d.done
                return (
                  <li key={d.department_id} className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-dark dark:text-light">
                        {d.name}
                      </span>
                      <span className="flex items-center gap-2 text-xs tabular-nums text-gray-600 dark:text-gray-300">
                        {total} {total === 1 ? 'tarefa' : 'tarefas'}
                        {d.overdue > 0 && (
                          <Badge tone="danger">
                            {d.overdue} atrasada{d.overdue === 1 ? '' : 's'}
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div
                      className="flex h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                      aria-hidden
                    >
                      {SEGMENTS.map(([key, , color]) =>
                        d[key] ? (
                          <div
                            key={key}
                            className={color}
                            style={{ width: `${(d[key] / total) * 100}%` }}
                          />
                        ) : null
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {SEGMENTS.map(
                        ([key, label]) => `${label} ${d[key]}`
                      ).join(' · ')}
                    </p>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Carga por pessoa">
            {report.by_assignee.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ninguém tem tarefas em aberto.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-300/40 text-gray-700 dark:bg-gray-500/40 dark:text-gray-200">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Pessoa</th>
                      <th className="px-3 py-3 font-semibold">Em aberto</th>
                      <th className="px-3 py-3 font-semibold">Atrasadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_assignee.map(a => (
                      <tr
                        key={a.admin_id}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="px-3 py-3 font-medium text-dark dark:text-light">
                          {a.name || ctx.adminName(a.admin_id)}
                        </td>
                        <td className="px-3 py-3">{a.open}</td>
                        <td
                          className={
                            a.overdue
                              ? 'px-3 py-3 font-medium text-red-600 dark:text-red-400'
                              : 'px-3 py-3'
                          }
                        >
                          {a.overdue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
