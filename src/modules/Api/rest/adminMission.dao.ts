import ApiDAO from './Api.dao'
import type {
  IAdminMissionRepository,
  RecalculateResult
} from '@/core/interfaces/IAdminMissionRepository'

export class AdminMissionDAO implements IAdminMissionRepository {
  async recalculateProgress(driverId: string): Promise<RecalculateResult> {
    return ApiDAO.post(
      `/api/v1/admin/drivers/${encodeURIComponent(driverId)}/mission-progress/recalculate`,
      {}
    )
  }
}
