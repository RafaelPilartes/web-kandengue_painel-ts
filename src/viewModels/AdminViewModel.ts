// viewModels/AdminViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppError } from '@/domain/errors/AppError'
import { adminUseCase } from '@/domain/usecases/adminUseCase'
import { AdminEntity } from '@/core/entities/Admin'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useMemo } from 'react'
import { getAdminRoleLabel, getUserStatusLabel } from '@/utils/gettersLabels'
import { withAudit } from '@/observability/audit'

export function useAdminsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<AdminEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de administradores */
  const {
    data: adminsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<AdminEntity[]>>({
    queryKey: [
      firebaseCollections.admins.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () => adminUseCase.executeGetAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  // transforma os dados em formato exportável
  const dataToExport = useMemo(() => {
    if (!adminsResponse?.data) return []
    return adminsResponse?.data.map(doc => ({
      Id: doc.id,
      Nome: doc.name,
      Email: doc.email,
      Telefone: doc.phone,
      Status: getUserStatusLabel(doc.status),
      Permissão: getAdminRoleLabel(doc.role),
      'Data de criação': doc.created_at,
      'Última atualização': doc.updated_at
    }))
  }, [adminsResponse?.data])

  /** Buscar admin por field */
  const fetchOneAdminByField = async (
    field: FieldPath<AdminEntity>,
    value: string
  ) => {
    try {
      return await adminUseCase.executeGetOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar admin por campo:', err)
      return null
    }
  }

  /** Buscar lista de administradores por field */
  const fetchAllAdminsByField = async (
    field: FieldPath<AdminEntity>,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await adminUseCase.executeGetAllByField(field, value, limit, offset)
    } catch (err) {
      // Engolir o erro e devolver `null` faz o chamador concluir "não
      // existe" — e foi isso que o ecrã de login mostrou quando as regras
      // recusaram a leitura por falta de claim no token. Uma recusa não é
      // uma ausência: essa distingue-se, e sobe.
      if (err instanceof AppError && err.code === 'permission-denied') {
        throw err
      }
      console.error('Erro ao buscar administradores por campo:', err)
      return null
    }
  }

  /** Criar administrador */
  const createAdmin = useMutation({
    mutationFn: (admin: Omit<AdminEntity, 'id'>) =>
      withAudit(() => adminUseCase.executeCreate(admin), {
        action: 'create',
        module: 'admins',
        description: `Criou administrador: ${admin.name} (${admin.email})`,
        target_type: 'admin',
        target_label: admin.name,
        new_data: admin
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.admins.root]
      })
    }
  })

  /** Atualizar administrador */
  const updateAdmin = useMutation({
    mutationFn: async ({
      id,
      admin
    }: {
      id: string
      admin: Partial<AdminEntity>
    }) => {
      const previous_data = await adminUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => adminUseCase.executeUpdate(id, admin), {
        action: 'update',
        module: 'admins',
        description: `Atualizou os dados do administrador - ID: ${id}`,
        target_id: id,
        target_type: 'admin',
        previous_data: previous_data || undefined,
        new_data: admin
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.admins.root]
      })
    }
  })

  /** Deletar administrador */
  const deleteAdmin = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await adminUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => adminUseCase.executeDelete(id), {
        action: 'delete',
        module: 'admins',
        description: `Excluiu o administrador - ID: ${id}`,
        target_id: id,
        target_type: 'admin',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.admins.root]
      })
    }
  })

  /** Buscar administrador único (on-demand) */
  const fetchAdminById = async (id: string) => {
    try {
      return await adminUseCase.executeGetById(id)
    } catch (err) {
      console.error('Erro ao buscar administrador:', err)
      return null
    }
  }

  /** Buscar administrador único (on-demand) */
  const fetchAdminByEmail = async (email: string) => {
    try {
      return await adminUseCase.executeGetByEmail(email)
    } catch (err) {
      console.error('Erro ao buscar administrador:', err)
      return null
    }
  }

  return {
    admins: adminsResponse?.data ?? [],
    pagination: adminsResponse?.pagination,
    isLoadingAdmins: loading,
    error,
    refresh: refetch,

    dataToExport,

    fetchAllAdminsByField,
    fetchOneAdminByField,
    fetchAdminByEmail,

    createAdmin,
    updateAdmin,
    deleteAdmin,
    fetchAdminById
  }
}
