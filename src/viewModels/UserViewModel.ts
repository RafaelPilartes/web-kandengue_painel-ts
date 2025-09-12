// viewModels/UserViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserService } from '@/services/users.service'
import { UserEntity } from '@/core/entities/User'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

const userService = new UserService()

export function useUsersViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<UserEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de usuarios */
  const {
    data: usersResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<UserEntity[]>>({
    queryKey: [
      firebaseCollections.users.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () => userService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de usuarios por field */
  const fetchAllUserSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await userService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar usuarios por campo:', err)
      return null
    }
  }

  /** 🔹 Criar usuario */
  const createUser = useMutation({
    mutationFn: (user: Omit<UserEntity, 'id'>) => userService.create(user),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.users.root]
      })
    }
  })

  /** 🔹 Atualizar usuario */
  const updateUser = useMutation({
    mutationFn: ({ id, user }: { id: string; user: Partial<UserEntity> }) =>
      userService.update(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.users.root]
      })
    }
  })

  /** 🔹 Deletar usuario */
  const deleteUser = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.users.root]
      })
    }
  })

  /** 🔹 Buscar usuario único (on-demand) */
  const fetchUserById = async (id: string) => {
    try {
      return await userService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar usuario:', err)
      return null
    }
  }

  /** 🔹 Buscar usuario único (on-demand) */
  const fetchUserByEmail = async (email: string) => {
    try {
      return await userService.getByEmail(email)
    } catch (err) {
      console.error('Erro ao buscar usuario:', err)
      return null
    }
  }

  return {
    users: usersResponse?.data ?? [],
    pagination: usersResponse?.pagination,
    isLoadingUsers: loading,
    error,
    refresh: refetch,

    fetchAllUserSByField,
    fetchUserByEmail,

    createUser,
    updateUser,
    deleteUser,
    fetchUserById
  }
}
