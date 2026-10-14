import ApiDAO from './Api.dao'
import type {
  DocumentDecisionResult,
  IAdminDriverRepository,
  ServiceResult
} from '@/core/interfaces/IAdminDriverRepository'
import type { RideType } from '@/types/enum'

export class AdminDriverDAO implements IAdminDriverRepository {
  async addService(
    driverId: string,
    service: RideType,
    confirmations: string[]
  ): Promise<ServiceResult> {
    return ApiDAO.post(`/api/v1/admin/drivers/${driverId}/services`, {
      service,
      confirmations
    })
  }

  /*
   * O serviço vai no **caminho**, não no corpo. A decisão é de 2026-10-14 e a
   * razão é esta chamada: no `axios` o corpo de um `delete` vai no terceiro
   * argumento, não no segundo como no `post` — quem a escrevesse da forma
   * óbvia mandava um `DELETE` sem corpo e recebia um 400 sobre um campo que
   * jurava ter enviado.
   */
  async removeService(
    driverId: string,
    service: RideType
  ): Promise<ServiceResult> {
    return ApiDAO.delete(
      `/api/v1/admin/drivers/${driverId}/services/${encodeURIComponent(service)}`
    )
  }

  async approveDocument(
    documentId: string,
    expiresAt?: Date
  ): Promise<DocumentDecisionResult> {
    return ApiDAO.post(`/api/v1/admin/documents/${documentId}/approve`, {
      ...(expiresAt ? { expires_at: expiresAt.toISOString() } : {})
    })
  }

  async rejectDocument(
    documentId: string,
    reason: string
  ): Promise<DocumentDecisionResult> {
    return ApiDAO.post(`/api/v1/admin/documents/${documentId}/reject`, {
      reason
    })
  }
}
