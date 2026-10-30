import { Building2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Panel } from '@/components/ui/panel'
import { routsNameMain } from '@/constants/routsName'
import type { DepartmentRow } from '@/modules/Api/rest/adminAccess.dao'
import { showToast } from '@/utils/toasts'
import { useDepartments } from '@/viewModels/AccessViewModel'
import { DepartmentModal } from './DepartmentModal'

export function DepartmentsPage() {
  const { departments, isLoading, update } = useDepartments()
  const [editing, setEditing] = useState<DepartmentRow | 'new' | null>(null)

  async function toggleActive(d: DepartmentRow) {
    try {
      await update.mutateAsync({ id: d.id, values: { active: !d.active } })
      showToast(
        'success',
        d.active ? `${d.name} desactivado.` : `${d.name} activado.`
      )
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Departamentos"
        description="Cada administrador pertence a um departamento. O que o departamento permite é o que os seus Gestores e Colaboradores podem usar."
        breadcrumbs={[
          { label: 'Início', to: routsNameMain.home },
          { label: 'Departamentos' }
        ]}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setEditing('new')}>
            Novo departamento
          </Button>
        }
      />

      <Panel>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500">
            A carregar departamentos…
          </p>
        ) : departments.length === 0 ? (
          <EmptyState
            icon={<Building2 size={36} />}
            title="Ainda não há departamentos"
            description="Crie o primeiro e depois atribua-lhe administradores no ecrã de Administradores."
            action={
              <Button onClick={() => setEditing('new')}>
                Criar departamento
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-300/40 text-gray-700 dark:bg-gray-500/40 dark:text-gray-200">
                <tr>
                  <th className="px-3 py-3 font-semibold">Departamento</th>
                  <th className="px-3 py-3 font-semibold">Membros</th>
                  <th className="px-3 py-3 font-semibold">Permissões</th>
                  <th className="px-3 py-3 font-semibold">Estado</th>
                  <th className="px-3 py-3 text-right font-semibold">Acções</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => (
                  <tr
                    key={d.id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-3 py-3 font-medium text-dark dark:text-light">
                      {d.name}
                    </td>
                    <td className="px-3 py-3">{d.member_count}</td>
                    <td className="px-3 py-3">{d.permissions.length}</td>
                    <td className="px-3 py-3">
                      <Badge tone={d.active ? 'success' : 'neutral'}>
                        {d.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(d)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(d)}
                        >
                          {d.active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editing && (
        <DepartmentModal
          department={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
