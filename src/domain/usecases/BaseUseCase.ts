import { toAppError } from '@/domain/errors/AppError'

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
}
