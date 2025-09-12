// viewModels/AdminViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminService } from '@/services/admins.service'
import { AdminEntity } from '@/core/entities/Admin'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

const adminService = new AdminService()

export function useAdminsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<AdminEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de administradores */
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
    queryFn: () => adminService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de administradores por field */
  const fetchAllAdminSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await adminService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar administradores por campo:', err)
      return null
    }
  }

  // const {
  //   data: adminsByFieldResponse,
  //   isLoading: loadingByField,
  //   error: errorByField
  // } = useQuery<ListResponseType<AdminEntity[]>>({
  //   queryKey: ['adminsByField', field, value, limit, offset],
  //   queryFn: () => adminService.getAllByField(field as string, value),
  //   enabled: !!field,
  //   staleTime: 1000 * 60 // cache 1min
  // })

  /** 🔹 Criar administrador */
  const createAdmin = useMutation({
    mutationFn: (admin: Omit<AdminEntity, 'id'>) => adminService.create(admin),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.admins.root]
      })
    }
  })

  /** 🔹 Atualizar administrador */
  const updateAdmin = useMutation({
    mutationFn: ({ id, admin }: { id: string; admin: Partial<AdminEntity> }) =>
      adminService.update(id, admin),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.admins.root]
      })
    }
  })

  /** 🔹 Deletar administrador */
  const deleteAdmin = useMutation({
    mutationFn: (id: string) => adminService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.admins.root]
      })
    }
  })

  /** 🔹 Buscar administrador único (on-demand) */
  const fetchAdminById = async (id: string) => {
    try {
      return await adminService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar administrador:', err)
      return null
    }
  }

  /** 🔹 Buscar administrador único (on-demand) */
  const fetchAdminByEmail = async (email: string) => {
    try {
      return await adminService.getByEmail(email)
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

    fetchAllAdminSByField,
    fetchAdminByEmail,

    createAdmin,
    updateAdmin,
    deleteAdmin,
    fetchAdminById
  }
}
