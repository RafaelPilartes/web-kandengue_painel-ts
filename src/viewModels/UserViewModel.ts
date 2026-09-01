// viewModels/UserViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userUseCase } from '@/domain/usecases/userUseCase'
import { UserEntity } from '@/core/entities/User'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useMemo } from 'react'
import { getUserStatusLabel } from '@/utils/gettersLabels'
import { withAudit } from '@/services/audit.service'

export function useUsersViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<UserEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de usuários */
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
    queryFn: () => userUseCase.executeGetAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  // transforma os dados em formato exportável
  const dataToExport = useMemo(() => {
    if (!usersResponse?.data) return []
    return usersResponse?.data.map(doc => ({
      Id: doc.id,
      Nome: doc.name,
      Email: doc.email,
      Telefone: doc.phone,
      Status: getUserStatusLabel(doc.status),
      'Data de criação': doc.created_at,
      'Última atualização': doc.updated_at
    }))
  }, [usersResponse?.data])

  /** Buscar lista de usuários por field */
  const fetchAllUsersByField = async (
    field: FieldPath<UserEntity>,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await userUseCase.executeGetAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar usuários por campo:', err)
      return null
    }
  }

  /** Criar usuário */
  const createUser = useMutation({
    mutationFn: (user: Omit<UserEntity, 'id'>) =>
      withAudit(() => userUseCase.executeCreate(user), {
        action: 'create',
        module: 'passengers',
        description: `Criou passageiro: ${user.name} (${user.email || user.phone})`,
        target_type: 'user',
        target_label: user.name,
        new_data: user
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.users.root]
      })
    }
  })

  /** Atualizar usuário */
  const updateUser = useMutation({
    mutationFn: async ({
      id,
      user
    }: {
      id: string
      user: Partial<UserEntity>
    }) => {
      const previous_data = await userUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => userUseCase.executeUpdate(id, user), {
        action: 'update',
        module: 'passengers',
        description: `Atualizou passageiro - ID: ${id}`,
        target_id: id,
        target_type: 'user',
        previous_data: previous_data || undefined,
        new_data: user
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.users.root]
      })
    }
  })

  /** Deletar usuário */
  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await userUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => userUseCase.executeDelete(id), {
        action: 'delete',
        module: 'passengers',
        description: `Excluiu passageiro - ID: ${id}`,
        target_id: id,
        target_type: 'user',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.users.root]
      })
    }
  })

  /** Soft delete usuário (Firestore: status=deleted + Auth: removeUser) */
  const softDeleteUser = useMutation({
    mutationFn: async ({
      id,
      firebaseUid
    }: {
      id: string
      firebaseUid?: string
    }) => {
      const previous_data = await userUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => userUseCase.executeSoftDelete(id, firebaseUid), {
        action: 'delete',
        module: 'passengers',
        description: `Soft-deletou passageiro - ID: ${id}`,
        target_id: id,
        target_type: 'user',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.users.root]
      })
    }
  })

  /** Buscar usuário único (on-demand) */
  const fetchUserById = async (id: string) => {
    try {
      return await userUseCase.executeGetById(id)
    } catch (err) {
      console.error('Erro ao buscar usuário:', err)
      return null
    }
  }

  /** Buscar usuário único (on-demand) */
  const fetchUserByEmail = async (email: string) => {
    try {
      return await userUseCase.executeGetByEmail(email)
    } catch (err) {
      console.error('Erro ao buscar usuário:', err)
      return null
    }
  }

  /** Buscar user por field */
  const fetchOneUserByField = async (
    field: FieldPath<UserEntity>,
    value: string
  ) => {
    try {
      return await userUseCase.executeGetOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar usuario por campo:', err)
      return null
    }
  }

  return {
    users: usersResponse?.data ?? [],
    pagination: usersResponse?.pagination,
    isLoadingUsers: loading,
    error,
    refresh: refetch,

    fetchAllUsersByField,
    fetchOneUserByField,
    fetchUserByEmail,

    createUser,
    updateUser,
    deleteUser,
    softDeleteUser,
    fetchUserById,

    dataToExport
  }
}
