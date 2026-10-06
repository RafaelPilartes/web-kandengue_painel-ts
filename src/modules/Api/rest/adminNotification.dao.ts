import ApiDAO from './Api.dao'
import type { IAdminNotificationRepository } from '@/core/interfaces/IAdminNotificationRepository'

export class AdminNotificationDAO implements IAdminNotificationRepository {
  async deleteNotification(
    notificationId: string
  ): Promise<{ id: string; deleted: boolean }> {
    return ApiDAO.delete(
      `/api/v1/admin/notifications/${encodeURIComponent(notificationId)}`
    )
  }
}
