import { Navigate } from 'react-router-dom'
import { useAdminStore } from '../stores/userStore'
import type { Props } from '../types/props'
import { useRideRatesViewModel } from '@/viewModels/RideRateViewModel'
import { useRideRatesStore } from '@/stores/rideRatesStore'
import { useEffect } from 'react'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'
import { showToast } from '@/utils/toasts'
import { routsNameMain } from '@/constants/routsName'
import { auditService } from '@/observability/audit'

export function Private({ children }: Props) {
  const { currentAdminData, removeAdmin } = useAdminStore()
  const { rideRates } = useRideRatesViewModel()
  const { addRideRatesData, currentRideRatesData } = useRideRatesStore()
  const { admins, isLoadingAdmins, fetchAdminByEmail } = useAdminsViewModel(100)

  useEffect(() => {
    // Sincronizar rideRates
    if (rideRates[0] && rideRates[0] !== currentRideRatesData) {
      addRideRatesData(rideRates[0])
    }

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
    rideRates,
    currentRideRatesData,
    addRideRatesData,
    admins,
    currentAdminData,
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

  return children
}

export function PrivateLogin({ children }: Props) {
  const { currentAdminData } = useAdminStore()

  if (currentAdminData) {
    return <Navigate to={'/'} />
  }

  return children
}
