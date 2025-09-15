import { Navigate } from 'react-router-dom'
import { useAdminStore } from '../stores/userStore'
import type { Props } from '../types/props'
import { useRideRatesViewModel } from '@/viewModels/RideRateViewModel'
import { useRideRatesStore } from '@/stores/rideRatesStore'
import { useEffect } from 'react'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'

export function Private({ children }: Props) {
  const { currentAdminData, removeAdmin } = useAdminStore()
  const { rideRates } = useRideRatesViewModel()
  const { addRideRatesData, currentRideRatesData } = useRideRatesStore()
  const { admins, isLoadingAdmins, deleteAdmin, updateAdmin } =
    useAdminsViewModel(100)

  // Atualiza os dados de rideRates apenas quando necessário, fora da renderização.
  useEffect(() => {
    if (rideRates[0] && rideRates[0] !== currentRideRatesData) {
      addRideRatesData(rideRates[0])
    }

    // Verificação de admin
    if (currentAdminData && !isLoadingAdmins) {
      const adminFound = admins.some(
        admin => admin.email === currentAdminData.email
      )

      if (!adminFound) {
        alert('Este admin não encontra-se disponível, faça o login novamente!')
        removeAdmin() // Remove o admin
      }
    }
  }, [
    rideRates,
    currentRideRatesData,
    addRideRatesData,
    admins,
    currentAdminData,
    removeAdmin,
    deleteAdmin,
    updateAdmin
  ]) // Garantindo que todas as dependências sejam consideradas

  if (!currentAdminData) {
    return <Navigate to={'/login'} />
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
