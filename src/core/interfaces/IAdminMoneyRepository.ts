/**
 * Operações de dinheiro do admin. Todas correm no servidor, numa transacção
 * única e idempotente, e são auditadas em `walletAuditLogs`.
 *
 * Nenhuma recebe `adminId`: a API tira-o do ID token verificado. Enviá-lo
 * do cliente permitiria forjar o registo de auditoria.
 */
export interface IAdminMoneyRepository {
  /** `credited: false` quando o pedido já estava aprovado — não é erro. */
  approveTopup(topupId: string): Promise<{ credited: boolean; balance: number }>

  approveWithdrawal(withdrawalId: string): Promise<{ changed: boolean }>

  rejectWithdrawal(
    withdrawalId: string,
    reason: string
  ): Promise<{ changed: boolean; revertedEarnings: number }>

  markWithdrawalPaid(
    withdrawalId: string
  ): Promise<{ changed: boolean; paidEarnings: number }>
}
