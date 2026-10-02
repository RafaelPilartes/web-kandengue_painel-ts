import ApiDAO from './Api.dao'
import type { IAdminVehicleRepository } from '@/core/interfaces/IAdminVehicleRepository'

export class AdminVehicleDAO implements IAdminVehicleRepository {
  async reviewVehicle(
    vehicleId: string,
    decision: 'validated' | 'rejected',
    reason?: string
  ): Promise<{ changed: boolean; status: 'validated' | 'rejected' }> {
    // O motivo só vai no corpo quando é uma recusa: o schema da API é uma
    // união discriminada e recusa um `reason` no braço da validação.
    return ApiDAO.post(`/api/v1/admin/vehicles/${vehicleId}/review`, {
      decision,
      ...(decision === 'rejected' ? { reason } : {})
    })
  }
}
