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
  setDoc
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

export class FirebaseDocumentDAO implements IDocumentRepository {
  private documentsRef = collection(db, firebaseCollections.documents.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: DocumentEntity[] }> {
    const snapshot = await getDocs(this.documentsRef)
    const documents = snapshot.docs.map(
      docSnap =>
        new DocumentEntity({
          ...(docSnap.data() as DocumentEntity)
        })
    )
    return {
      data: documents
    }
  }

  async getById(id: string): Promise<ListResponseType<DocumentEntity> | null> {
    const docSnap = await getDoc(doc(this.documentsRef, id))
    if (!docSnap.exists()) return null
    const documentData = new DocumentEntity({
      ...(docSnap.data() as DocumentEntity)
    })
    return {
      data: documentData
    }
  }

  async getAllByField(
    field: keyof DocumentEntity,
    value: any
  ): Promise<ListResponseType<DocumentEntity[]>> {
    const q = query(this.documentsRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const documents = querySnapshot.docs.map(
      docSnap =>
        new DocumentEntity({
          ...(docSnap.data() as DocumentEntity)
        })
    )
    return { data: documents }
  }

  async create(
    document: Omit<DocumentEntity, 'id'>
  ): Promise<ListResponseType<DocumentEntity>> {
    const documentId = crypto.randomUUID()
    const sanitized = this.sanitize(document)

    await setDoc(doc(this.documentsRef, documentId), sanitized)

    const documentData = new DocumentEntity({ id: documentId, ...document })
    return { data: documentData }
  }

  async update(
    id: string,
    document: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity>> {
    const sanitized = this.sanitize(document)
    await updateDoc(doc(this.documentsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Document not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.documentsRef, id))
  }
}
