import ApiDAO from './Api.dao'
import type {
  DocumentDecisionResult,
  DriverStatusResult,
  IAdminDriverRepository,
  ServiceResult,
  SettableDriverStatus
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

  async setStatus(
    driverId: string,
    status: SettableDriverStatus
  ): Promise<DriverStatusResult> {
    return ApiDAO.post(`/api/v1/admin/drivers/${driverId}/status`, { status })
  }

  /*
   * The service goes in the **path**, not in the body. Decided 2026-10-14, and
   * this very call is the reason: in `axios` the body of a `delete` goes in
   * the third argument, not the second as in `post` — whoever wrote it the
   * obvious way would send a `DELETE` with no body and get a 400 about a field
   * they were sure they had sent.
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
