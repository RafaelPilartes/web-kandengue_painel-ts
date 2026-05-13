// viewModels/ApplicationViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApplicationService } from '@/services/applications.service'
import { ApplicationEntity } from '@/core/entities/Application'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useMemo } from 'react'
import { getApplicationStatusLabel } from '@/utils/gettersLabels'
import { withAudit } from '@/services/audit.service'

const applicationService = new ApplicationService()

export function useApplicationsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<ApplicationEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de usuários */
  const {
    data: applicationsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<ApplicationEntity[]>>({
    queryKey: [
      firebaseCollections.applications.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () =>
      applicationService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  // transforma os dados em formato exportável
  const dataToExport = useMemo(() => {
    if (!applicationsResponse?.data) return []
    return applicationsResponse?.data.map(doc => ({
      Id: doc.id,
      Nome: doc.first_name,
      Sobrenome: doc.last_name,
      Email: doc.email,
      Telefone: doc.phone,
      Status: getApplicationStatusLabel(doc.status),
      'Data de criação': doc.created_at,
      'Última atualização': doc.updated_at
    }))
  }, [applicationsResponse?.data])

  /** Buscar lista de usuários por field */
  const fetchAllApplicationsByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await applicationService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar usuários por campo:', err)
      return null
    }
  }

  /** Criar usuário */
  const createApplication = useMutation({
    mutationFn: (application: Omit<ApplicationEntity, 'id'>) =>
      withAudit(() => applicationService.create(application), {
        action: 'create',
        module: 'applications',
        description: `Criou candidatura: ${application.first_name || ''} ${application.last_name || ''}`,
        target_type: 'application',
        target_label: application.email,
        new_data: application
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.applications.root]
      })
    }
  })

  /** Atualizar usuário */
  const updateApplication = useMutation({
    mutationFn: async ({
      id,
      application
    }: {
      id: string
      application: Partial<ApplicationEntity>
    }) => {
      const previous_data = await applicationService
        .getById(id)
        .catch(() => null)
      return withAudit(() => applicationService.update(id, application), {
        action: 'update',
        module: 'applications',
        description: `Atualizou candidatura - ID: ${id}`,
        target_id: id,
        target_type: 'application',
        previous_data: previous_data || undefined,
        new_data: application
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.applications.root]
      })
    }
  })

  /** Deletar usuário */
  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await applicationService
        .getById(id)
        .catch(() => null)
      return withAudit(() => applicationService.delete(id), {
        action: 'delete',
        module: 'applications',
        description: `Excluiu candidatura - ID: ${id}`,
        target_id: id,
        target_type: 'application',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.applications.root]
      })
    }
  })

  /** Buscar usuário único (on-demand) */
  const fetchApplicationById = async (id: string) => {
    try {
      return await applicationService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar usuário:', err)
      return null
    }
  }

  /** Buscar usuário único (on-demand) */
  const fetchApplicationByEmail = async (email: string) => {
    try {
      return await applicationService.getByEmail(email)
    } catch (err) {
      console.error('Erro ao buscar usuário:', err)
      return null
    }
  }

  /** Buscar application por field */
  const fetchOneApplicationByField = async (
    field: keyof ApplicationEntity,
    value: string
  ) => {
    try {
      return await applicationService.getOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar usuario por campo:', err)
      return null
    }
  }

  return {
    applications: applicationsResponse?.data ?? [],
    pagination: applicationsResponse?.pagination,
    isLoadingApplications: loading,
    error,
    refresh: refetch,

    fetchAllApplicationsByField,
    fetchOneApplicationByField,
    fetchApplicationByEmail,

    createApplication,
    updateApplication,
    deleteApplication,
    fetchApplicationById,

    dataToExport
  }
}
