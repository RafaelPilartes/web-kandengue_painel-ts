import ApiDAO from './Api.dao'
import type { IPushNotificationRepository } from '@/core/interfaces/IPushNotificationRepository'

export class PushNotificationDAO implements IPushNotificationRepository {
  async send(notificationId: string, token: string): Promise<void> {
    try {
      await ApiDAO.post(
        '/notifications/send',
        { notificationId },
        { Authorization: `Bearer ${token}` }
      )
    } catch (error: any) {
      console.error('Falha ao disparar push notification via API:', error)
      throw new Error(error.message || 'Erro ao enviar push notification')
    }
  }
}
