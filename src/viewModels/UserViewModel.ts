import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserService } from '@/services/users.service'
import { UserEntity } from '@/core/entities/User'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const userService = new UserService()

export function useUsersViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de usuários */
  const {
    data: usersResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<UserEntity[]>>({
    queryKey: ['users', limit, offset],
    queryFn: () => userService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Criar usuário */
  const createUser = useMutation({
    mutationFn: (user: Omit<UserEntity, 'id'>) => userService.create(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  /** 🔹 Atualizar usuário */
  const updateUser = useMutation({
    mutationFn: ({ id, user }: { id: string; user: Partial<UserEntity> }) =>
      userService.update(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  /** 🔹 Deletar usuário */
  const deleteUser = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  /** 🔹 Buscar usuário único (on-demand) */
  const fetchUserById = async (id: string) => {
    try {
      return await userService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar usuário:', err)
      return null
    }
  }

  return {
    users: usersResponse?.data ?? [],
    pagination: usersResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    createUser,
    updateUser,
    deleteUser,
    fetchUserById
  }
}
