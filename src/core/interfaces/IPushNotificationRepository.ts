export interface IPushNotificationRepository {
  send(notificationId: string, token: string): Promise<void>
}
