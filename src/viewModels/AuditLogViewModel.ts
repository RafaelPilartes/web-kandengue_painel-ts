// viewModels/AuditLogViewModel.ts
import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/audit.service'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { AuditLogInterface, AuditModule } from '@/interfaces/IAuditLog'
import type { LogActionType } from '@/types/enum'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { useMemo } from 'react'

export function useAuditLogViewModel(
  limit?: number,
  offset?: number,
  filters?: {
    admin_id?: string
    module?: AuditModule
    action?: LogActionType
    severity?: string
    startDate?: Date
    endDate?: Date
    searchTerm?: string
  }
) {
  const filtersKey = filters ? JSON.stringify(filters) : ''

  const {
    data: logsResponse,
    isLoading,
    error,
    refetch
  } = useQuery<ListResponseType<AuditLogInterface[]>>({
    queryKey: [firebaseCollections.auditLogs.root, limit, offset, filtersKey],
    queryFn: () => auditService.getAll(limit, offset, filters),
    staleTime: 1000 * 30 // 30s cache
  })

  const dataToExport = useMemo(() => {
    if (!logsResponse?.data) return []
    return logsResponse.data.map(log => ({
      Data: log.created_at
        ? new Date(log.created_at).toLocaleString('pt-AO')
        : '',
      Admin: log.admin_name,
      Email: log.admin_email,
      Ação: log.action,
      Módulo: log.module,
      Descrição: log.description,
      Severidade: log.severity,
      Sucesso: log.success ? 'Sim' : 'Não',
      IP: log.ip_address,
      Localização: log.location
        ? `${log.location.city || ''} ${log.location.country || ''}`.trim()
        : 'N/A'
    }))
  }, [logsResponse?.data])

  return {
    logs: logsResponse?.data ?? [],
    pagination: logsResponse?.pagination,
    isLoading,
    error,
    refresh: refetch,
    dataToExport
  }
}
