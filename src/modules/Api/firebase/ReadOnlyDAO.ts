import { AppError } from '@/domain/errors/AppError'
import { AppendOnlyDAO } from './AppendOnlyDAO'

/**
 * Colecções só-leitura no cliente: a escrita vive na API, em transacções
 * auditadas. Só-leitura é append-only menos a criação.
 */
export abstract class ReadOnlyDAO<
  T extends { id: string }
> extends AppendOnlyDAO<T> {
  // Assinatura igual à do `BaseFirebaseDAO` — ver nota em `AppendOnlyDAO`.
  override async create(
    _data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    _id?: string
  ): Promise<T> {
    throw new AppError(
      'failed-precondition',
      `[${this.path}] é só-leitura neste cliente — a escrita vive na API.`
    )
  }
}
