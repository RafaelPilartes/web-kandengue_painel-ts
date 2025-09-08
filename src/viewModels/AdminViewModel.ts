import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminService } from '@/services/admins.service'
import { AdminEntity } from '@/core/entities/Admin'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const adminService = new AdminService()

export function useAdminsViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de administradores */
  const {
    data: adminsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<AdminEntity[]>>({
    queryKey: ['admins', limit, offset],
    queryFn: () => adminService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Criar administrador */
  const createAdmin = useMutation({
    mutationFn: (admin: Omit<AdminEntity, 'id'>) => adminService.create(admin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    }
  })

  /** 🔹 Atualizar administrador */
  const updateAdmin = useMutation({
    mutationFn: ({ id, admin }: { id: string; admin: Partial<AdminEntity> }) =>
      adminService.update(id, admin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    }
  })

  /** 🔹 Deletar administrador */
  const deleteAdmin = useMutation({
    mutationFn: (id: string) => adminService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
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

  return {
    admins: adminsResponse?.data ?? [],
    pagination: adminsResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    createAdmin,
    updateAdmin,
    deleteAdmin,
    fetchAdminById
  }
}
