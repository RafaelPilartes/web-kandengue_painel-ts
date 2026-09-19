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

// ── O caminho que estava partido ──
// O `run()` só consegue escolher a mensagem certa se o erro lhe chegar com
// o `code` do Firebase intacto. Um `catch` intermédio que re-lance com
// `new Error(err.message)` descarta-o, e tudo passa a "erro inesperado".
describe('run() preserva o código do erro', () => {
  class Falhador extends BaseUseCase {
    protected readonly context = 'Teste'
    comCodigo(code: string) {
      return this.run('op', async () => {
        throw Object.assign(new Error('mensagem crua do Firebase'), { code })
      })
    }
    semCodigo() {
      return this.run('op', async () => {
        // O anti-padrão: embrulhar e perder o `code`.
        throw new Error('mensagem crua do Firebase')
      })
    }
  }
  const uc = new Falhador()

  it('um erro de auth chega com a mensagem própria, sem o contexto lá dentro', async () => {
    await expect(uc.comCodigo('auth/invalid-credential')).rejects.toMatchObject({
      code: 'invalid-credential',
      message: 'E-mail ou senha incorretos.',
      context: '[Teste.op]'
    })
  })

  it('um erro sem código continua a ser genérico — é o que se quer evitar', async () => {
    await expect(uc.semCodigo()).rejects.toMatchObject({
      code: 'unknown',
      message: 'Ocorreu um erro inesperado.'
    })
  })
})
