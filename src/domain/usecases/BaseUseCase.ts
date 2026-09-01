import { toAppError } from '@/domain/errors/AppError'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'
import type { ListResponseType } from '@/interfaces/IApiResponse'

/**
 * Substitui o try/catch + console.error copiado em cada método de cada
 * service. O usecase concreto só escreve a regra de negócio.
 */
export abstract class BaseUseCase {
  protected abstract readonly context: string

  protected async run<T>(op: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err) {
      throw toAppError(err, `[${this.context}.${op}]`)
    }
  }

  /**
   * Traduz `offset` (paginação por registos saltados, da API antiga) para o
   * cursor por `id` que o motor espera.
   *
   * Estava copiado em catorze services, idêntico em todos menos no tipo da
   * entidade. O custo é o mesmo do código antigo: uma query de `offset`
   * documentos para descobrir onde começar.
   */
  protected async offsetToCursor<T extends { id: string }>(
    repository: { getAll(options: QueryOptions<T>): Promise<ListResponseType<T[]>> },
    base: Omit<QueryOptions<T>, 'limit' | 'after'>,
    offset: number
  ): Promise<string | undefined> {
    if (!offset) return undefined
    const skipped = await repository.getAll({ ...base, limit: offset })
    return skipped.data[skipped.data.length - 1]?.id
  }
}
