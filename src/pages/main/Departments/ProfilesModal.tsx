import { ADMIN_PERMISSION_LABELS } from '@rafaelpilartes/kandengue-shared/constants'
import { isSensitiveProfile } from '@rafaelpilartes/kandengue-shared/functions'
import type { AdminPermission } from '@rafaelpilartes/kandengue-shared/types'
import { Plus, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { AppModal } from '@/components/modal/AppModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type {
  DepartmentRow,
  ProfileRow
} from '@/modules/Api/rest/adminAccess.dao'
import { showToast } from '@/utils/toasts'
import {
  useDepartmentProfiles,
  useProfileMutations
} from '@/viewModels/AccessViewModel'

/**
 * The profiles of one department.
 *
 * ── What a profile is, and why the checkboxes are bounded ──
 * A department holds the permissions that EXIST in it; a profile is a named
 * subset of them, and an admin gets a profile. So this screen can only offer
 * what the department has — the API refuses the rest with
 * `PERMISSION_OUTSIDE_DEPARTMENT`, and offering a checkbox that would come back
 * 400 is worse than not offering it.
 *
 * Narrow the department and a profile keeps the permission written down but
 * stops granting it: `resolveAdminAccess` intersects. The list below says so
 * out loud rather than hiding it.
 */
export function ProfilesModal({
  department,
  onClose
}: {
  department: DepartmentRow
  onClose: () => void
}) {
  const { profiles, isLoading } = useDepartmentProfiles(department.id)
  const { create, update } = useProfileMutations(department.id)
  const [editing, setEditing] = useState<ProfileRow | 'new' | null>(null)

  async function toggleActive(profile: ProfileRow) {
    try {
      await update.mutateAsync({
        profileId: profile.id,
        values: { active: !profile.active }
      })
      showToast(
        'success',
        profile.active
          ? `Perfil "${profile.name}" desactivado.`
          : `Perfil "${profile.name}" activado.`
      )
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  return (
    <AppModal
      isOpen
      onClose={onClose}
      size="lg"
      title={`Perfis de ${department.name}`}
      description="Um perfil é um conjunto de permissões com nome, escolhidas dentro das do departamento. Cada administrador tem um departamento e um perfil."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button icon={<Plus size={16} />} onClick={() => setEditing('new')}>
            Novo perfil
          </Button>
        </>
      }
    >
      {editing ? (
        <ProfileForm
          department={department}
          profile={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSave={async values => {
            try {
              if (editing === 'new') {
                await create.mutateAsync(values)
                showToast('success', `Perfil "${values.name}" criado.`)
              } else {
                await update.mutateAsync({ profileId: editing.id, values })
                showToast('success', `Perfil "${values.name}" guardado.`)
              }
              setEditing(null)
            } catch (err) {
              showToast('error', (err as Error).message)
            }
          }}
          isSaving={create.isPending || update.isPending}
        />
      ) : isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500">
          A carregar perfis…
        </p>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert size={36} />}
          title="Este departamento ainda não tem perfis"
          description="Sem um perfil, ninguém neste departamento tem permissões."
          action={<Button onClick={() => setEditing('new')}>Criar perfil</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {profiles.map(profile => (
            <li
              key={profile.id}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-dark dark:text-light">
                    {profile.name}
                    {!profile.active && <Badge tone="neutral">Inactivo</Badge>}
                    {isSensitiveProfile(profile) && (
                      <Badge tone="warning">Sensível</Badge>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {profile.member_count}{' '}
                    {profile.member_count === 1 ? 'pessoa' : 'pessoas'} ·{' '}
                    {profile.permissions.length}{' '}
                    {profile.permissions.length === 1
                      ? 'permissão'
                      : 'permissões'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(profile)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive(profile)}
                  >
                    {profile.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                {profile.permissions.length === 0
                  ? 'Nenhuma permissão.'
                  : profile.permissions
                      .map(p => ADMIN_PERMISSION_LABELS[p])
                      .join(' · ')}
              </p>

              {/*
               * A permission a profile names and the department no longer has
               * is written down but grants nothing. Saying so beats letting
               * someone read the list and believe it.
               */}
              {profile.permissions.some(
                p => !department.permissions.includes(p)
              ) && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Sem efeito, porque o departamento já não as tem:{' '}
                  {profile.permissions
                    .filter(p => !department.permissions.includes(p))
                    .map(p => ADMIN_PERMISSION_LABELS[p])
                    .join(', ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppModal>
  )
}

function ProfileForm({
  department,
  profile,
  onCancel,
  onSave,
  isSaving
}: {
  department: DepartmentRow
  profile?: ProfileRow
  onCancel: () => void
  onSave: (values: {
    name: string
    permissions: AdminPermission[]
  }) => Promise<void>
  isSaving: boolean
}) {
  const [name, setName] = useState(profile?.name ?? '')
  const [permissions, setPermissions] = useState<AdminPermission[]>(
    profile?.permissions ?? []
  )

  const toggle = (permission: AdminPermission) =>
    setPermissions(current =>
      current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission]
    )

  return (
    <form
      className="flex w-full flex-col gap-5"
      onSubmit={event => {
        event.preventDefault()
        if (name.trim().length < 2) {
          showToast('error', 'O nome do perfil tem de ter pelo menos 2 letras.')
          return
        }
        void onSave({ name: name.trim(), permissions })
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nome do perfil</span>
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Ex.: Gestor, Técnico, Atendimento"
          className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-200 dark:border-gray-600"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">
          Permissões, dentro das do departamento
        </legend>
        {department.permissions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Este departamento não tem permissões nenhumas, por isso um perfil
            dele também não pode ter. Acrescente-as ao departamento primeiro.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {department.permissions.map(permission => (
              <label
                key={permission}
                className="flex items-start gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={permissions.includes(permission)}
                  onChange={() => toggle(permission)}
                  className="mt-0.5 h-4 w-4 accent-primary-200"
                />
                <span>{ADMIN_PERMISSION_LABELS[permission]}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {isSensitiveProfile({ permissions }) && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Este perfil tem permissões sensíveis. Quem tem "Gerir equipa" não o
          pode atribuir — só a Direcção e quem gere contas.
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSaving}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
