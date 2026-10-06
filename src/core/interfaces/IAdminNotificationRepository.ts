/**
 * Apagar uma notificação. Corre no servidor, com o conteúdo anterior em
 * `auditLogs`.
 *
 * As regras sempre negaram o `delete` ao cliente, por isso o botão do painel
 * **nunca funcionou** — falhava com `permission-denied` e o ecrã mostrava
 * "Erro ao excluir notificação". A criação continua no painel
 * (`create: if ehAdmin()`), com o push disparado pela API.
 */
export interface IAdminNotificationRepository {
  /** `deleted: false` quando já não existia — não é erro. */
  deleteNotification(
    notificationId: string
  ): Promise<{ id: string; deleted: boolean }>
}
