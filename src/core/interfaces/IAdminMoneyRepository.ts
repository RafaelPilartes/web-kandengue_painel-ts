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

  /** `paid: false` quando a missão já estava paga — não é erro. `balance` é `null` quando `type_paid` é `'cash'`, porque nenhuma carteira foi afectada. */
  payMissionBonus(input: {
    driver_id: string
    mission_id: string
    type_paid: 'cash' | 'wallet'
  }): Promise<{ paid: boolean; balance: number | null }>

  /** Retorna `walletId`, não `id`. */
  createWallet(input: {
    user_id: string
    user: { id: string; firebase_uid: string; [key: string]: unknown }
    initial_balance: number
    currency: string
    status: string
    reason?: string
  }): Promise<{ walletId: string; balance: number }>

  /**
   * Activa ou desactiva uma carteira. Não move dinheiro.
   * `changed: false` quando a carteira já estava nesse estado — não é erro.
   */
  setWalletStatus(
    walletId: string,
    status: 'active' | 'inactive',
    reason?: string
  ): Promise<{ changed: boolean; status: 'active' | 'inactive' }>
}
