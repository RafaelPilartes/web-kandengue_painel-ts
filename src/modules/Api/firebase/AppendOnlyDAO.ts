import { AppError } from '@/domain/errors/AppError'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

/**
 * Colecções imutáveis: escreve-se uma vez e nunca mais se toca.
 * Um registo de auditoria que se pode editar não é auditoria.
 *
 * As Security Rules hão-de bloquear isto no servidor; aqui falha mais cedo
 * e com uma mensagem que diz porquê.
 */
export abstract class AppendOnlyDAO<
  T extends { id: string }
> extends BaseFirebaseDAO<T> {
  // Assinatura igual à do `BaseFirebaseDAO` — só assim o TypeScript aceita o
  // override. Os parâmetros nunca são usados: chegam a lançar antes disso.
  override async update(_id: string, _data: Partial<T>): Promise<T> {
    throw new AppError(
      'failed-precondition',
      `[${this.path}] é imutável — não se pode alterar um registo já escrito.`
    )
  }

  override async delete(_id: string): Promise<void> {
    throw new AppError(
      'failed-precondition',
      `[${this.path}] é append-only — não se pode apagar um registo.`
    )
  }
}
