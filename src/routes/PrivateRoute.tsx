import { Navigate, useLocation } from 'react-router-dom'
import { useAdminStore } from '../stores/userStore'
import type { Props } from '../types/props'
import { useEffect } from 'react'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'
import { showToast } from '@/utils/toasts'
import { routsNameMain } from '@/constants/routsName'
import { auditService } from '@/observability/audit'
import { useAccess } from '@/hooks/useAccess'
import { NoAccess } from '@/components/ui/no-access'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { permissionFor } from './access'

/*
 * ⚠️ **Já não lê `rideRates` no arranque.**
 *
 * Carregava a tarifa para o `rideRatesStore` em cada entrada no painel, para
 * o ecrã de Configurações a editar. Essas abas saíram (os preços vivem em
 * Preços → Perfis) e a regra passou `rideRates` a `allow write: if false` —
 * o store não tinha mais ninguém a lê-lo, e era uma leitura por sessão a
 * alimentar nada.
 */
export function Private({ children }: Props) {
  const { currentAdminData, removeAdmin } = useAdminStore()
  const { admins, isLoadingAdmins, fetchAdminByEmail } = useAdminsViewModel(100)

  useEffect(() => {
    // Verificação de admin em tempo real
    async function checkAdmin() {
      if (currentAdminData && !isLoadingAdmins) {
        const adminFound = await fetchAdminByEmail(currentAdminData.email)

        if (!adminFound) {
          showToast(
            'error',
            'Este admin não se encontra disponível. Faça login novamente.'
          )
          removeAdmin()
        }
      }
    }

    checkAdmin()
  }, [
    admins,
    currentAdminData,
    isLoadingAdmins,
    fetchAdminByEmail,
    removeAdmin
  ])

  useEffect(() => {
    if (currentAdminData) {
      auditService.setAdmin(currentAdminData)
      auditService.initialize()
    } else {
      auditService.setAdmin(null)
    }
  }, [currentAdminData])

  if (!currentAdminData) {
    return <Navigate to={routsNameMain.login} replace />
  }

  return <RequireAccess>{children}</RequireAccess>
}

/**
 * The screen opens only when the admin's department grants its permission
 * (`./access.ts`). The API refuses the same calls; this is what keeps the
 * admin from landing on a page full of 403s.
 */
export function RequireAccess({ children }: Props) {
  const { pathname } = useLocation()
  const access = useAccess()
  const permission = permissionFor(pathname)

  if (access.isLoading) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        A confirmar os seus acessos…
      </div>
    )
  }
  if (access.isError) {
    // Fails closed: without the API there is no way to know what is allowed.
    return (
      <div className="rounded-md bg-light dark:bg-dark">
        <EmptyState
          title="Não foi possível confirmar os seus acessos"
          description="O servidor não respondeu. Verifique a ligação e tente outra vez."
          action={
            <Button onClick={() => window.location.reload()}>
              Tentar outra vez
            </Button>
          }
        />
      </div>
    )
  }
  if (access.level === null) return <NoAccess unassigned />
  if (permission && !access.can(permission)) {
    // The dashboard is the default landing page; send whoever cannot see it to their tasks.
    if (pathname === '/') return <Navigate to="/work/tasks" replace />
    return <NoAccess />
  }
  return children
}

export function PrivateLogin({ children }: Props) {
  const { currentAdminData } = useAdminStore()

  if (currentAdminData) {
    return <Navigate to={'/'} />
  }

  return children
}
