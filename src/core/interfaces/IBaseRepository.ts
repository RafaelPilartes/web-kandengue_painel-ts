import type { ListResponseType } from '@/interfaces/IApiResponse'

export interface QueryOptions<T> {
  /** Máximo de documentos a devolver. Omisso: 50. */
  limit?: number
  /** Cursor: ID do último documento da página anterior. */
  after?: string | null
  /** Campo de ordenação. Omisso: `created_at`. */
  orderBy?: keyof T
  orderDirection?: 'asc' | 'desc'
  /** Filtros de igualdade. Valores `undefined` ou `''` são ignorados. */
  filters?: Partial<T>
  /** Pesquisa por prefixo sobre o `searchField` do DAO. */
  searchTerm?: string
  /** Pedir o total da colecção. Custa 1 leitura agregada. Omisso: false. */
  withTotal?: boolean
}

export interface ListenOptions<T> {
  limit?: number
  orderBy?: keyof T
  orderDirection?: 'asc' | 'desc'
  filters?: Partial<T>
}

/**
 * Contrato único de acesso a dados. `T` é sempre a **Entity** — a conversão
 * Doc→Entity é responsabilidade do converter, dentro do DAO.
 *
 * Todos os métodos `listen*` devolvem a função de unsubscribe.
 */
export interface IBaseRepository<T extends { id: string }> {
  // ---- Leitura ----
  getAll(options?: QueryOptions<T>): Promise<ListResponseType<T[]>>
  getById(id: string): Promise<T | null>
  getAllByField(
    field: keyof T,
    value: unknown,
    options?: Omit<QueryOptions<T>, 'filters'>
  ): Promise<ListResponseType<T[]>>
  getOneByField(field: keyof T, value: unknown): Promise<T | null>
  count(filters?: Partial<T>): Promise<number>

  // ---- Escrita ----
  create(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>

  // ---- Realtime ----
  listenById(
    id: string,
    onUpdate: (data: T | null) => void,
    onError?: (err: Error) => void
  ): () => void

  listenAll(
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options?: ListenOptions<T>
  ): () => void

  listenAllByField(
    field: keyof T,
    value: unknown,
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options?: Omit<ListenOptions<T>, 'filters'>
  ): () => void
}
