// modules/Api/firebase/auditLog.dao.ts
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  orderBy,
  where,
  limit as fbLimit,
  startAfter,
  getCountFromServer,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { generateId } from '@/helpers/generateId'
import type {
  AuditLogInterface,
  AuditModule
} from '@/interfaces/IAuditLog'
import type { LogActionType } from '@/types/enum'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class FirebaseAuditLogDAO {
  private logsRef = collection(db, firebaseCollections.auditLogs.root)

  private sanitize(data: any): any {
    if (data === null || data === undefined) return data
    if (data instanceof Date || data instanceof Timestamp) return data
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item)).filter(item => item !== undefined)
    }
    if (typeof data === 'object') {
      const sanitizedObj: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          sanitizedObj[key] = this.sanitize(value)
        }
      }
      return sanitizedObj
    }
    return data
  }

  async create(log: Omit<AuditLogInterface, 'id'>): Promise<AuditLogInterface> {
    const logId = generateId('log')
    const sanitized = this.sanitize({
      ...log,
      id: logId,
      created_at: log.created_at || new Date()
    })

    await setDoc(doc(this.logsRef, logId), sanitized)
    return { id: logId, ...log }
  }

  async getAll(
    limitValue = 50,
    offset = 0,
    filters?: {
      admin_id?: string
      module?: AuditModule
      action?: LogActionType
      severity?: string
      startDate?: Date
      endDate?: Date
      searchTerm?: string
    }
  ): Promise<ListResponseType<AuditLogInterface[]>> {
    let baseQuery: any = query(this.logsRef, orderBy('created_at', 'desc'))

    if (filters?.admin_id) {
      baseQuery = query(baseQuery, where('admin_id', '==', filters.admin_id))
    }
    if (filters?.module) {
      baseQuery = query(baseQuery, where('module', '==', filters.module))
    }
    if (filters?.action) {
      baseQuery = query(baseQuery, where('action', '==', filters.action))
    }
    if (filters?.severity) {
      baseQuery = query(baseQuery, where('severity', '==', filters.severity))
    }

    let total = 0
    try {
      const countSnap = await getCountFromServer(baseQuery)
      total = countSnap.data().count
    } catch (err) {
      console.warn('Erro ao obter count de logs:', err)
    }

    let finalQuery = query(baseQuery, fbLimit(limitValue))
    if (offset > 0) {
      const skipQuery = query(baseQuery, fbLimit(offset))
      const skipSnap = await getDocs(skipQuery)
      const lastVisible = skipSnap.docs[skipSnap.docs.length - 1]
      if (!lastVisible) {
        return {
          data: [],
          pagination: { limit: limitValue, offset, count: total }
        }
      }
      finalQuery = query(baseQuery, startAfter(lastVisible), fbLimit(limitValue))
    }

    const snapshot = await getDocs(finalQuery)

    if (snapshot.empty) {
      return {
        data: [],
        pagination: { limit: limitValue, offset, count: total }
      }
    }

    const logs = snapshot.docs.map(docSnap => {
      const data = docSnap.data() as Record<string, any>
      return {
        ...data,
        id: docSnap.id,
        created_at:
          data.created_at instanceof Timestamp
            ? data.created_at.toDate()
            : data.created_at
      } as AuditLogInterface
    })

    return {
      data: logs,
      pagination: { limit: limitValue, offset, count: total }
    }
  }
}
