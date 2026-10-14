import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'
import type { DocumentDecisionResult } from '@/core/interfaces/IAdminDriverRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class DocumentUseCase extends BaseUseCase {
  protected readonly context = 'DocumentUseCase'

  private get repository() {
    return ApiRepository.documents
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity[]>> {
    return this.run('getAll', async () => {
      const base = { searchTerm, filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)
      return this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    })
  }

  executeGetById(id: string): Promise<DocumentEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: FieldPath<DocumentEntity>,
    value: unknown
  ): Promise<DocumentEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<DocumentEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DocumentEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<DocumentEntity>
      const base = { filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)

      const { data, pagination } = await this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    })
  }

  executeCreate(document: Omit<DocumentEntity, 'id'>): Promise<DocumentEntity> {
    return this.run('create', () => this.repository.create(document))
  }

  executeUpdate(
    id: string,
    document: Partial<DocumentEntity>
  ): Promise<DocumentEntity> {
    return this.run('update', () => this.repository.update(id, document))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }

  /**
   * Aprova um documento **pela API** (3.7), com validade opcional.
   *
   * ⚠️ **A validade é o fim do dia escolhido, na hora de Luanda** — quem a
   * converte é quem a recolhe (o ecrã), com o `fimDoDiaEmLuanda`. A lib
   * compara instantes (`expires_at > now`): a meia-noite do dia 31 caduca a
   * apólice no próprio dia 31, e o motorista perde o dia que ela cobre.
   *
   * Fora do `run()`: a mensagem da API é a que explica a recusa.
   */
  executeApprove(id: string, expiresAt?: Date): Promise<DocumentDecisionResult> {
    return ApiRepository.adminDriver.approveDocument(id, expiresAt)
  }

  /**
   * Recusa um documento, **com motivo obrigatório** — e o motivo vai para o
   * `feedback`, que é o campo que o motorista vê.
   *
   * O painel escrevia `{status: 'rejected'}` e nunca `feedback`: o motorista
   * recebia um "rejeitado" sem saber o que corrigir e voltava a submeter o
   * mesmo documento.
   */
  executeReject(id: string, reason: string): Promise<DocumentDecisionResult> {
    return ApiRepository.adminDriver.rejectDocument(id, reason)
  }
}

export const documentUseCase = new DocumentUseCase()
