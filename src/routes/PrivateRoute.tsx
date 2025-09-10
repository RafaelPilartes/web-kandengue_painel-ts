import { Navigate } from 'react-router-dom'
import { useAdminStore } from '../stores/userStore'
import type { Props } from '../types/props'

export function Private({ children }: Props) {
  const { currentAdminData } = useAdminStore()

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
