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
  getCountFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import type {
  CollectionReference,
  FirestoreDataConverter,
  QueryConstraint,
  Query
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type {
  FieldPath,
  IBaseRepository,
  ListenOptions,
  QueryOptions
} from '@/core/interfaces/IBaseRepository'
import { AppError, toAppError } from '@/domain/errors/AppError'
import { generateId } from '@/helpers/generateId'

/** Sentinela de fim de intervalo para pesquisa por prefixo no Firestore. */
const PREFIX_END = ''

/**
 * Campo aceite como `searchField`: ou um campo real da entidade (`keyof T &
 * string`), ou um caminho aninhado com ponto (`driver.email`).
 *
 * O caminho aninhado NÃO é verificado contra a entidade — é uma promessa de
 * quem chama, porque `keyof` não descreve caminhos aninhados. Um campo de
 * topo continua sujeito à verificação normal, o que recusa nomes inexistentes
 * (foi isso que apanhou os bugs do lote 1) e typos.
 */
export type SearchField<T> = (keyof T & string) | `${string}.${string}`

/**
 * Motor CRUD + realtime partilhado.
 *
 * Dois contratos que os subclasses TÊM de respeitar:
 *
 * 1. `toFirestore` do converter tem de ser identidade em forma (`{ ...entity }`).
 *    `create` usa `setDoc`, que o corre, mas `update` usa `updateDoc`, que NÃO
 *    o corre — um converter que renomeie ou achate campos escreveria formas
 *    diferentes nos dois caminhos. `create` também lhe passa um objecto simples,
 *    não uma instância: getters e métodos da entidade não estão disponíveis.
 *
 * 2. A chave do documento tem de ser igual ao campo `id` no corpo. A paginação
 *    por cursor devolve `entity.id` e volta a resolvê-lo com `doc(ref, after)`.
 *
 * Nota sobre ordenação: `orderBy` do Firestore EXCLUI documentos sem o campo.
 * A ordenação por omissão é `created_at`; uma colecção cujos documentos não o
 * tenham fica invisível em `getAll` — mas continua a ser contada por `count()`,
 * que não ordena. Colecções nessas condições declaram o seu campo no 5º
 * argumento do construtor (ver `missionProgress.dao.ts`).
 */
export abstract class BaseFirebaseDAO<T extends { id: string }>
  implements IBaseRepository<T>
{
  protected readonly ref: CollectionReference<T>
  protected readonly path: string
  protected readonly idPrefix: string
  protected readonly searchField?: SearchField<T>
  /**
   * Campo da ordenação por omissão. `orderBy` do Firestore EXCLUI documentos
   * sem o campo, portanto uma colecção sem `created_at` fica invisível em
   * `getAll` se não declarar o seu.
   */
  protected readonly defaultOrderField: string

  /**
   * @param path        path da colecção — sempre vindo de `firebaseCollections`
   * @param converter   fronteira Doc ↔ Entity
   * @param idPrefix    prefixo dos IDs gerados no cliente (ex.: 'veh')
   * @param searchField campo usado no prefix-search. TEM de estar gravado em
   *                    minúsculas no documento e ter índice. Um caminho com
   *                    ponto (`driver.email`) é aninhado e NÃO é verificado
   *                    contra a entidade — é uma promessa de quem chama.
   * @param defaultOrderField campo da ordenação por omissão. Só é preciso em
   *                    colecções sem `created_at` — sem ele, `getAll` devolve
   *                    vazio nessas colecções.
   */
  constructor(
    path: string,
    converter: FirestoreDataConverter<T>,
    idPrefix: string,
    searchField?: SearchField<T>,
    defaultOrderField?: keyof T & string
  ) {
    this.path = path
    this.idPrefix = idPrefix
    this.searchField = searchField
    this.defaultOrderField = defaultOrderField ?? 'created_at'
    this.ref = collection(db, path).withConverter(converter)
  }

  /** Todos os erros do Firestore passam por aqui: contexto + código legível. */
  protected fail(op: string, err: unknown): never {
    throw toAppError(err, `[${this.path}.${op}]`)
  }

  protected equalityConstraints(filters?: Partial<T>): QueryConstraint[] {
    if (!filters) return []
    return Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([field, value]) => where(field, '==', value))
  }

  protected constraints(
    options: QueryOptions<T> | ListenOptions<T>
  ): QueryConstraint[] {
    const constraints: QueryConstraint[] = []

    constraints.push(...this.equalityConstraints(options.filters))

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
          (options.orderBy as string) ?? this.defaultOrderField,
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
    field: FieldPath<T>,
    value: unknown,
    options: Omit<QueryOptions<T>, 'filters'> = {}
  ): Promise<ListResponseType<T[]>> {
    return this.getAll({
      ...options,
      filters: { [field]: value } as Partial<T>
    })
  }

  async getOneByField(field: FieldPath<T>, value: unknown): Promise<T | null> {
    try {
      const snap = await getDocs(
        query(this.ref, where(field as string, '==', value), fbLimit(1))
      )
      return snap.empty ? null : snap.docs[0].data()
    } catch (err) {
      this.fail('getOneByField', err)
    }
  }

  /** Conta sem ordenar — inclui documentos que `getAll` esconde por lhes
   *  faltar o campo de ordenação. Ver o doc comment da classe. */
  async count(filters?: Partial<T>): Promise<number> {
    try {
      return (
        await getCountFromServer(
          query(this.ref, ...this.equalityConstraints(filters))
        )
      ).data().count
    } catch (err) {
      this.fail('count', err)
    }
  }

  async create(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ): Promise<T> {
    try {
      const newId = id ?? generateId(this.idPrefix)

      await setDoc(doc(this.ref, newId), {
        ...(data as object),
        id: newId,
        created_at: serverTimestamp(),
        updated_at: null
      } as unknown as T)

      // Read-back: devolve o que ficou realmente gravado (com o created_at do
      // servidor resolvido), não uma reconstrução optimista que diverge.
      const created = await this.getById(newId)
      if (!created) {
        this.fail(
          'create',
          new AppError('not-found', 'documento não encontrado após criação')
        )
      }
      return created
    } catch (err) {
      this.fail('create', err)
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // `id` e `created_at` são imutáveis: descartados em silêncio.
      const rest = { ...(data as Record<string, unknown>) }
      delete rest.id
      delete rest.created_at

      await updateDoc(doc(this.ref, id), {
        ...rest,
        updated_at: serverTimestamp()
      })

      const updated = await this.getById(id)
      if (!updated) {
        this.fail(
          'update',
          new AppError('not-found', 'documento não encontrado após update')
        )
      }
      return updated
    } catch (err) {
      this.fail('update', err)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.ref, id))
    } catch (err) {
      this.fail('delete', err)
    }
  }

  /**
   * Um listener sem `onError` morrer em silêncio é caríssimo de diagnosticar:
   * a UI só pára de actualizar. Sem handler, pelo menos regista.
   */
  protected onListenError(
    op: string,
    err: unknown,
    onError?: (err: Error) => void
  ): void {
    const appError = toAppError(err, `[${this.path}.${op}]`)
    if (onError) {
      onError(appError)
      return
    }
    console.error(appError.message, appError)
  }

  listenById(
    id: string,
    onUpdate: (data: T | null) => void,
    onError?: (err: Error) => void
  ): () => void {
    return onSnapshot(
      doc(this.ref, id),
      snap => onUpdate(snap.exists() ? snap.data() : null),
      err => this.onListenError('listenById', err, onError)
    )
  }

  listenAll(
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options: ListenOptions<T> = {}
  ): () => void {
    // Limite por omissão: um listener sem travão lê a colecção inteira a cada
    // alteração e paga 1 leitura por documento.
    const limitValue = options.limit ?? 50
    const q: Query<T> = query(
      this.ref,
      ...this.constraints(options),
      fbLimit(limitValue)
    )

    return onSnapshot(
      q,
      // Os documentos vêm no próprio snapshot — nunca re-fazer a query aqui.
      snap => onUpdate(snap.docs.map(d => d.data())),
      err => this.onListenError('listenAll', err, onError)
    )
  }

  listenAllByField(
    field: FieldPath<T>,
    value: unknown,
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options: Omit<ListenOptions<T>, 'filters'> = {}
  ): () => void {
    return this.listenAll(onUpdate, onError, {
      ...options,
      filters: { [field]: value } as Partial<T>
    })
  }
}
