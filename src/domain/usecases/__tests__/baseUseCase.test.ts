import { describe, it, expect } from 'vitest'
import { BaseUseCase } from '@/domain/usecases/BaseUseCase'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'
import type { ListResponseType } from '@/interfaces/IApiResponse'

type Item = { id: string }

/** Repositório falso: não precisa de emulador para testar o helper. */
class FakeRepository {
  private readonly items: Item[]

  constructor(items: Item[]) {
    this.items = items
  }

  async getAll(options: QueryOptions<Item>): Promise<ListResponseType<Item[]>> {
    const limit = options.limit ?? this.items.length
    const start = options.after
      ? this.items.findIndex(item => item.id === options.after) + 1
      : 0
    const data = this.items.slice(start, start + limit)
    return { data }
  }
}

class TestUseCase extends BaseUseCase {
  protected readonly context = 'TestUseCase'

  exposeOffsetToCursor(repository: FakeRepository, offset: number) {
    return this.offsetToCursor(repository, {}, offset)
  }
}

describe('BaseUseCase.offsetToCursor', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const useCase = new TestUseCase()

  it('offset zero devolve undefined', async () => {
    const repository = new FakeRepository(items)
    expect(await useCase.exposeOffsetToCursor(repository, 0)).toBeUndefined()
  })

  it('offset N devolve o id do N-ésimo registo', async () => {
    const repository = new FakeRepository(items)
    expect(await useCase.exposeOffsetToCursor(repository, 2)).toBe('b')
  })

  it('offset para lá do fim devolve o último id existente', async () => {
    const repository = new FakeRepository(items)
    expect(await useCase.exposeOffsetToCursor(repository, 10)).toBe('c')
  })

  it('a chamada seguinte com esse cursor devolve vazio (não é regressão)', async () => {
    const repository = new FakeRepository(items)
    const cursor = await useCase.exposeOffsetToCursor(repository, 10)

    const next = await repository.getAll({ after: cursor, limit: 50 })
    expect(next.data).toEqual([])
  })
})
