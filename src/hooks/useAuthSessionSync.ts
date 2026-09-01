import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authUseCase } from '@/domain/usecases/authUseCase'
import { useAdminStore } from '@/stores/userStore'

/**
 * Mantém o estado local do painel alinhado com a sessão real do Firebase.
 *
 * O `PrivateRoute` decide com base em `currentAdminData`, que vive num store
 * Zustand persistido em localStorage. A sessão real vive no Firebase Auth.
 * Sem esta ligação, um refresh token morto deixa o localStorage a dizer que o
 * admin está autenticado enquanto todas as chamadas à API falham — e nada
 * redirecciona para o login.
 */
export function useAuthSessionSync(): void {
  const queryClient = useQueryClient()
  const { currentAdminData, removeAdmin } = useAdminStore()

  useEffect(() => {
    const unsubscribe = authUseCase.executeOnAuthChanged(user => {
      if (user) return

      // Só limpa se havia algo para limpar: na página de login não há sessão
      // nem admin, e sem esta guarda o hook disparava a cada montagem.
      if (!currentAdminData) return

      // A cache tem de ir também, senão o próximo admin a entrar vê os dados
      // do anterior até ao primeiro refetch.
      removeAdmin()
      queryClient.clear()
    })

    return unsubscribe
  }, [currentAdminData, removeAdmin, queryClient])
}
