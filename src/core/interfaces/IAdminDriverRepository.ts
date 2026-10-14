import type { RideType } from '@/types/enum'

/**
 * Os requisitos que faltam a um motorista para um serviço, como a API os
 * devolve no `details` de uma recusa (3.7).
 *
 * ⚠️ **Não se recalcula no painel.** Quem avalia é o servidor, contra a
 * `SERVICE_REQUIREMENTS` da lib — e é por isso que esta rota existe: a
 * verificação vivia no ecrã, e um ecrã não é uma garantia (quem abrisse a
 * consola do browser aprovava-se a si mesmo). O painel **mostra** o que o
 * servidor disse.
 */
export interface MissingRequirement {
  /** A chave estável — é o que vai para a auditoria. */
  key: string
  /** O que o admin lê. */
  label: string
  kind: 'document' | 'vehicle' | 'manual'
  /** Porquê: 'não foi submetido', 'aprovado mas **caducado**', 'está em pending'. */
  detalhe: string
}

export interface ServiceResult {
  driver_id: string
  services: RideType[]
  /** `false` quando já estava assim — a chamada foi um no-op, não um erro. */
  changed: boolean
}

export interface DocumentDecisionResult {
  id: string
  status: 'approved' | 'rejected'
  changed: boolean
}

/**
 * Aprovar serviços e decidir documentos — as quatro rotas da sub-fase 3.7.
 *
 * Substituem escritas directas do painel no Firestore: `drivers.services` e
 * `documents.status`. A regra da Fase 7 passa a negá-las ao cliente; esta
 * interface é o caminho certo, construído primeiro.
 */
export interface IAdminDriverRepository {
  /**
   * Acrescenta um serviço, **se os requisitos estiverem cumpridos**.
   *
   * Recusa com `SERVICE_REQUIREMENTS_NOT_MET` e a lista do que falta no
   * `details` — ver o `missingRequirements` do `apiError`.
   *
   * `confirmations` são as chaves dos requisitos **manuais** que o admin
   * confirma neste pedido (o capacete extra do moto táxi). Sem elas, a
   * aprovação é recusada: a única prova de que alguém o viu é esta
   * confirmação, e ela fica em `auditLogs` com o nome de quem a deu.
   */
  addService(
    driverId: string,
    service: RideType,
    confirmations: string[]
  ): Promise<ServiceResult>

  /** Retirar nunca é bloqueado. O que se exige é o registo de quem tirou. */
  removeService(driverId: string, service: RideType): Promise<ServiceResult>

  /**
   * Aprova um documento, com validade opcional.
   *
   * ⚠️ **A validade grava-se como o fim do dia escolhido**, na hora de Luanda
   * — ver o `fimDoDiaEmLuanda`. A lib compara instantes (`expires_at > now`),
   * por isso a meia-noite do dia 13 caduca às 00:00:01 do dia 13 e o
   * motorista perdia o dia que a apólice ainda cobre.
   */
  approveDocument(
    documentId: string,
    expiresAt?: Date
  ): Promise<DocumentDecisionResult>

  /**
   * Recusa um documento, **com motivo obrigatório**.
   *
   * O motivo vai para o `feedback`, que é o campo que o **motorista** vê. O
   * painel escrevia `{status: 'rejected'}` e nunca `feedback`: o motorista
   * recebia um 'rejeitado' sem saber o que corrigir e voltava a submeter o
   * mesmo documento.
   */
  rejectDocument(
    documentId: string,
    reason: string
  ): Promise<DocumentDecisionResult>
}
