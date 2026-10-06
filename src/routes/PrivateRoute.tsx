import { Navigate } from 'react-router-dom'
import { useAdminStore } from '../stores/userStore'
import type { Props } from '../types/props'
import { useEffect } from 'react'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'
import { showToast } from '@/utils/toasts'
import { routsNameMain } from '@/constants/routsName'
import { auditService } from '@/observability/audit'

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
  }, [admins, currentAdminData, isLoadingAdmins, fetchAdminByEmail, removeAdmin])

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

  return children
}

export function PrivateLogin({ children }: Props) {
  const { currentAdminData } = useAdminStore()

  if (currentAdminData) {
    return <Navigate to={'/'} />
  }

  return children
}
