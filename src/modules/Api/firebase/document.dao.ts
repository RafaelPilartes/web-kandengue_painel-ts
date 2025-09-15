// modules/Api/firebase/documents.dao.ts
import type { IDocumentRepository } from '@/core/interfaces/IDocumentRepository'
import { DocumentEntity } from '@/core/entities/Document'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  orderBy,
  limit as fbLimit,
  startAfter,
  getCountFromServer
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { generateId } from '@/helpers/generateId'

export class FirebaseDocumentDAO implements IDocumentRepository {
  private documentsRef = collection(db, firebaseCollections.documents.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<DocumentEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** 🔹 Listar documents com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.documentsRef, filters)

    // 2) se tiver searchTerm
    const search = searchTerm?.toString().trim()
    if (search) {
      const lower = search.toLowerCase()
      baseQuery = query(
        baseQuery,
        orderBy('email'),
        where('email', '>=', lower),
        where('email', '<=', lower + '\uf8ff')
      )
    } else {
      // padrão: ordena por createdAt (use o campo consistente no seu DB)
      baseQuery = query(baseQuery, orderBy('created_at', 'desc'))
    }

    // 3) conta total com mesma baseQuery (opcionalmente, se quiser performance, você pode evitar)
    let total = 0
    try {
      const countSnap = await getCountFromServer(baseQuery)
      total = countSnap.data().count
    } catch (err) {
      // se count falhar, não interrompe; continua sem count
      console.warn('Erro ao obter count:', err)
    }

    // 4) se offset > 0 -> precisamos do lastVisible correspondente ao offset
    let finalQuery = query(baseQuery, fbLimit(limitValue)) // default
    if (offset > 0) {
      // NOTE: esse "skip" é caro para offsets grandes — ver nota abaixo
      const skipQuery = query(baseQuery, fbLimit(offset))
      const skipSnap = await getDocs(skipQuery)
      const lastVisible = skipSnap.docs[skipSnap.docs.length - 1]
      if (!lastVisible) {
        // offset maior do que registros existentes
        return {
          data: [],
          pagination: { limit: limitValue, offset, count: total }
        }
      }
      finalQuery = query(
        baseQuery,
        startAfter(lastVisible),
        fbLimit(limitValue)
      )
    }

    const snapshot = await getDocs(finalQuery)

    if (snapshot.empty) {
      return {
        data: [],
        pagination: { limit: limitValue, offset, count: total }
      }
    }

    const documents = snapshot.docs.map(
      docSnap =>
        new DocumentEntity({
          ...(docSnap.data() as DocumentEntity)
        })
    )

    return {
      data: documents,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<DocumentEntity | null> {
    const docSnap = await getDoc(doc(this.documentsRef, id))
    if (!docSnap.exists()) return null
    const documentData = new DocumentEntity({
      ...(docSnap.data() as DocumentEntity)
    })
    return documentData
  }

  async getAllByField(
    field: keyof DocumentEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<DocumentEntity[]>> {
    const filters: Partial<DocumentEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async create(document: Omit<DocumentEntity, 'id'>): Promise<DocumentEntity> {
    const documentId = generateId('doc')
    const sanitized = {
      ...this.sanitize(document),
      id: documentId,
      created_at: new Date()
    }

    await setDoc(doc(this.documentsRef, documentId), sanitized)

    const documentData = new DocumentEntity({ id: documentId, ...document })
    return documentData
  }

  async update(
    id: string,
    document: Partial<DocumentEntity>
  ): Promise<DocumentEntity> {
    const sanitized = {
      ...this.sanitize(document),
      updated_at: new Date()
    }
    await updateDoc(doc(this.documentsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Document not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.documentsRef, id))
  }
}
