import { Navigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import type { Props } from '../types/props'

export function Private({ children }: Props) {
  const { currentUserData } = useUserStore()

  if (!currentUserData) {
    return <Navigate to={'/login'} />
  }

  return children
}

export function PrivateLogin({ children }: Props) {
  const { currentUserData } = useUserStore()

  if (currentUserData) {
    return <Navigate to={'/'} />
  }

  return children
}
