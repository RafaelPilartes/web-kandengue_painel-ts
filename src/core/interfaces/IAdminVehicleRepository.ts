/**
 * Validação de viaturas. Corre no servidor, numa transacção, e fica em
 * `auditLogs` — não em `walletAuditLogs`: não é uma operação de dinheiro.
 *
 * Não recebe `adminId`: a API tira-o do ID token verificado.
 */
export interface IAdminVehicleRepository {
  /**
   * Valida ou recusa uma viatura. O motivo é obrigatório na recusa e é o que
   * o motorista vai ler na app (`rejection_reason`).
   *
   * `changed: false` quando a viatura já estava nesse estado — não é erro.
   * Retirar uma viatura já validada é recusado pela API: tira o motorista do
   * dispatch e é uma operação com consequências próprias.
   */
  reviewVehicle(
    vehicleId: string,
    decision: 'validated' | 'rejected',
    reason?: string
  ): Promise<{ changed: boolean; status: 'validated' | 'rejected' }>
}
