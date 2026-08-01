import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  startAfter,
  getCountFromServer
} from 'firebase/firestore'
import type {
  CollectionReference,
  FirestoreDataConverter,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type {
  IBaseRepository,
  ListenOptions,
  QueryOptions
} from '@/core/interfaces/IBaseRepository'
import { AppError, toAppError } from '@/domain/errors/AppError'

/** Sentinela de fim de intervalo para pesquisa por prefixo no Firestore. */
const PREFIX_END = ''

export abstract class BaseFirebaseDAO<T extends { id: string }> implements Pick<
  IBaseRepository<T>,
  'getAll' | 'getById' | 'getAllByField' | 'getOneByField' | 'count'
> {
  protected readonly ref: CollectionReference<T>
  protected readonly path: string
  protected readonly idPrefix: string
  protected readonly searchField?: keyof T & string

  /**
   * @param path        path da colecção — sempre vindo de `firebaseCollections`
   * @param converter   fronteira Doc ↔ Entity
   * @param idPrefix    prefixo dos IDs gerados no cliente (ex.: 'veh')
   * @param searchField campo usado no prefix-search. TEM de estar gravado em
   *                    minúsculas no documento e ter índice.
   */
  constructor(
    path: string,
    converter: FirestoreDataConverter<T>,
    idPrefix: string,
    searchField?: keyof T & string
  ) {
    this.path = path
    this.idPrefix = idPrefix
    this.searchField = searchField
    this.ref = collection(db, path).withConverter(converter)
  }

  /** Todos os erros do Firestore passam por aqui: contexto + código legível. */
  protected fail(op: string, err: unknown): never {
    throw toAppError(err, `[${this.path}.${op}]`)
  }

  protected constraints(
    options: QueryOptions<T> | ListenOptions<T>
  ): QueryConstraint[] {
    const constraints: QueryConstraint[] = []

    if (options.filters) {
      for (const [field, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== '') {
          constraints.push(where(field, '==', value))
        }
      }
    }

    const term =
      'searchTerm' in options
        ? options.searchTerm?.trim().toLowerCase()
        : undefined

    if (term) {
      if (!this.searchField) {
        throw new AppError(
          'failed-precondition',
          `[${this.path}] pesquisa pedida mas o DAO não tem searchField configurado.`
        )
      }
      // Um range obriga o primeiro orderBy a ser no mesmo campo — por isso a
      // pesquisa ignora o orderBy pedido.
      constraints.push(orderBy(this.searchField))
      constraints.push(where(this.searchField, '>=', term))
      constraints.push(where(this.searchField, '<=', term + PREFIX_END))
    } else {
      constraints.push(
        orderBy(
          (options.orderBy as string) ?? 'created_at',
          options.orderDirection ?? 'desc'
        )
      )
    }

    return constraints
  }

  async getAll(options: QueryOptions<T> = {}): Promise<ListResponseType<T[]>> {
    try {
      const limitValue = options.limit ?? 50
      const base = query(this.ref, ...this.constraints(options))

      let total: number | undefined
      if (options.withTotal) {
        total = (await getCountFromServer(base)).data().count
      }

      // Lê-se limit+1 para saber se há página seguinte sem uma segunda query.
      const cursorSnap = options.after
        ? await getDoc(doc(this.ref, options.after))
        : null

      if (options.after && !cursorSnap?.exists()) {
        throw new AppError(
          'not-found',
          `[${this.path}.getAll] cursor "${options.after}" não existe — pesquisa não pode continuar.`
        )
      }

      const paged = cursorSnap?.exists()
        ? query(base, startAfter(cursorSnap), fbLimit(limitValue + 1))
        : query(base, fbLimit(limitValue + 1))

      const snap = await getDocs(paged)
      const hasMore = snap.docs.length > limitValue
      const docs = hasMore ? snap.docs.slice(0, limitValue) : snap.docs
      const data = docs.map(d => d.data())

      return {
        data,
        pagination: {
          limit: limitValue,
          count: data.length,
          total,
          cursor: data.length ? data[data.length - 1].id : null,
          hasMore
        }
      }
    } catch (err) {
      this.fail('getAll', err)
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const snap = await getDoc(doc(this.ref, id))
      return snap.exists() ? snap.data() : null
    } catch (err) {
      this.fail('getById', err)
    }
  }

  async getAllByField(
    field: keyof T,
    value: unknown,
    options: Omit<QueryOptions<T>, 'filters'> = {}
  ): Promise<ListResponseType<T[]>> {
    return this.getAll({
      ...options,
      filters: { [field]: value } as Partial<T>
    })
  }

  async getOneByField(field: keyof T, value: unknown): Promise<T | null> {
    try {
      const snap = await getDocs(
        query(this.ref, where(field as string, '==', value), fbLimit(1))
      )
      return snap.empty ? null : snap.docs[0].data()
    } catch (err) {
      this.fail('getOneByField', err)
    }
  }

  async count(filters?: Partial<T>): Promise<number> {
    try {
      const constraints = filters
        ? Object.entries(filters)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([f, v]) => where(f, '==', v))
        : []
      return (await getCountFromServer(query(this.ref, ...constraints))).data()
        .count
    } catch (err) {
      this.fail('count', err)
    }
  }
}
