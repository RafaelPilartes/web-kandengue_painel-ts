/**
 * Acções de admin sobre uma corrida que o cliente não pode fazer.
 *
 * As regras negam ao cliente — admin incluído — tocar em `fare`, `rate`,
 * `quote_id`, `type`, `vehicle_type` e nos dois campos da revisão. Quem
 * fecha a tarifa é o servidor; quem a marca como revista é a API.
 */
export interface IAdminRideRepository {
  /**
   * Marca a tarifa como revista. **Não altera a tarifa** — nesta fase só
   * registra quem olhou e quando, em `auditLogs`.
   *
   * `changed: false` quando já estava marcada — não é erro. A API recusa
   * marcar uma corrida que não está sinalizada para revisão.
   */
  markFareReviewed(rideId: string, note?: string): Promise<{ changed: boolean }>
}
