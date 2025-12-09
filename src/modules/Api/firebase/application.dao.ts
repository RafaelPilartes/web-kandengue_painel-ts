// modules/Api/firebase/applications.dao.ts
import type { IApplicationRepository } from '../../../core/interfaces/IApplicationRepository'
import { ApplicationEntity } from '../../../core/entities/Application'
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
import { db } from '../../../config/firebase.config'
import type { ListResponseType } from '../../../interfaces/IApiResponse'
import { firebaseCollections } from '../../../constants/firebaseCollections'
import { generateId } from '../../../helpers/generateId'

export class FirebaseApplicationDAO implements IApplicationRepository {
  private applicationsRef = collection(
    db,
    firebaseCollections.applications.root
  )

  // Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<ApplicationEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** Listar applications com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<ApplicationEntity>
  ): Promise<ListResponseType<ApplicationEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.applicationsRef, filters)

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

    const applications = snapshot.docs.map(
      docSnap =>
        new ApplicationEntity({
          ...(docSnap.data() as ApplicationEntity)
        })
    )

    return {
      data: applications,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<ApplicationEntity | null> {
    const docSnap = await getDoc(doc(this.applicationsRef, id))
    if (!docSnap.exists()) return null

    console.log('dataApplication =>', docSnap.data())

    return docSnap.data() as ApplicationEntity
  }

  async getAllByField(
    field: keyof ApplicationEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<ApplicationEntity[]>> {
    const filters: Partial<ApplicationEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async getOneByField(
    field: string,
    value: any
  ): Promise<ApplicationEntity | null> {
    const querySnapshot = await getDocs(
      query(this.applicationsRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const adminData = new ApplicationEntity({
      ...(querySnapshot.docs[0].data() as ApplicationEntity)
    })
    return adminData
  }

  async getByEmail(email: string): Promise<ApplicationEntity | null> {
    const querySnapshot = await getDocs(
      query(this.applicationsRef, where('email', '==', email))
    )
    if (querySnapshot.empty) return null

    const applicationData = new ApplicationEntity({
      id: querySnapshot.docs[0].id,
      ...(querySnapshot.docs[0].data() as ApplicationEntity)
    })
    return applicationData
  }

  async create(
    application: Omit<ApplicationEntity, 'id'>
  ): Promise<ApplicationEntity> {
    const applicationId = generateId('appl')
    const sanitized = {
      ...this.sanitize(application),
      id: applicationId,
      created_at: new Date()
    }

    await setDoc(doc(this.applicationsRef, applicationId), sanitized)

    const applicationData = new ApplicationEntity({
      id: applicationId,
      ...application
    })
    return applicationData
  }

  async update(
    id: string,
    application: Partial<ApplicationEntity>
  ): Promise<ApplicationEntity> {
    const sanitized = {
      ...this.sanitize(application),
      updated_at: new Date()
    }
    await updateDoc(doc(this.applicationsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Application not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.applicationsRef, id))
  }
}
