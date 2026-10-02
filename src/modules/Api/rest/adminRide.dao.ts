import ApiDAO from './Api.dao'
import type { IAdminRideRepository } from '@/core/interfaces/IAdminRideRepository'

export class AdminRideDAO implements IAdminRideRepository {
  async markFareReviewed(
    rideId: string,
    note?: string
  ): Promise<{ changed: boolean }> {
    return ApiDAO.post(`/api/v1/admin/rides/${rideId}/fare-review`, {
      ...(note ? { note } : {})
    })
  }
}
