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
   * Approves a document **through the API** (3.7), with an optional expiry.
   *
   * ⚠️ **The expiry is the end of the chosen day, Luanda time** — whoever
   * collects it converts it (the screen), with `endOfDayInLuanda`. The lib
   * compares instants (`expires_at > now`): midnight on the 31st expires the
   * policy on the 31st itself, and the driver loses the day it covers.
   *
   * Outside `run()`: the API's message is what explains a refusal.
   */
  executeApprove(id: string, expiresAt?: Date): Promise<DocumentDecisionResult> {
    return ApiRepository.adminDriver.approveDocument(id, expiresAt)
  }

  /**
   * Rejects a document, **with a mandatory reason** — and the reason goes to
   * `feedback`, the field the driver sees.
   *
   * The panel used to write `{status: 'rejected'}` and never `feedback`: the
   * driver got a "rejected" with no idea what to fix and resubmitted the same
   * document.
   */
  executeReject(id: string, reason: string): Promise<DocumentDecisionResult> {
    return ApiRepository.adminDriver.rejectDocument(id, reason)
  }
}

export const documentUseCase = new DocumentUseCase()
