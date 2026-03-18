import type { IMissionRepository } from '@/core/interfaces/IMissionRepository'
import { MissionEntity } from '@/core/entities/Mission'
import { MissionProgressEntity } from '@/core/entities/MissionProgress'
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
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { generateId } from '@/helpers/generateId'

export class FirebaseMissionDAO implements IMissionRepository {
  private missionsRef = collection(db, firebaseCollections.missions.root)
  private progressRef = collection(db, firebaseCollections.missionProgress.root)

  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(
    limitValue: number = 50,
    _offset = 0,
    _searchTerm?: string,
    filters?: Partial<MissionEntity>
  ): Promise<ListResponseType<MissionEntity[]>> {
    let q = query(this.missionsRef, orderBy('created_at', 'desc'))

    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined) {
          q = query(q, where(field, '==', value))
        }
      })
    }

    q = query(q, fbLimit(limitValue))
    const snapshot = await getDocs(q)

    const missions = snapshot.docs.map(docSnap => {
      const data = docSnap.data()
      return new MissionEntity({
        ...data,
        id: docSnap.id,
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: data.updated_at
          ? (data.updated_at as Timestamp).toDate()
          : undefined
      } as any)
    })

    return {
      data: missions,
      pagination: { limit: limitValue, offset: 0, count: missions.length }
    }
  }

  async getById(id: string): Promise<MissionEntity | null> {
    const docSnap = await getDoc(doc(this.missionsRef, id))
    if (!docSnap.exists()) return null
    const data = docSnap.data()
    return new MissionEntity({
      ...data,
      id: docSnap.id,
      created_at: (data.created_at as Timestamp).toDate(),
      updated_at: data.updated_at
        ? (data.updated_at as Timestamp).toDate()
        : undefined
    } as any)
  }

  async create(mission: Omit<MissionEntity, 'id'>): Promise<MissionEntity> {
    const id = generateId('miss')
    const data = {
      ...this.sanitize(mission),
      id,
      created_at: Timestamp.now()
    }
    await setDoc(doc(this.missionsRef, id), data)
    return new MissionEntity({ ...mission, id, created_at: new Date() })
  }

  async update(
    id: string,
    mission: Partial<MissionEntity>
  ): Promise<MissionEntity> {
    const data = {
      ...this.sanitize(mission),
      updated_at: Timestamp.now()
    }
    await updateDoc(doc(this.missionsRef, id), data)
    const updated = await this.getById(id)
    if (!updated) throw new Error('Mission not found after update')
    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.missionsRef, id))
  }

  async getProgress(
    driver_id: string,
    mission_id: string
  ): Promise<MissionProgressEntity | null> {
    const q = query(
      this.progressRef,
      where('driver_id', '==', driver_id),
      where('mission_id', '==', mission_id)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const docSnap = snapshot.docs[0]
    const data = docSnap.data()
    return new MissionProgressEntity({
      ...data,
      id: docSnap.id,
      completed_at: data.completed_at
        ? (data.completed_at as Timestamp).toDate()
        : undefined,
      last_updated: data.last_updated
        ? (data.last_updated as Timestamp).toDate()
        : undefined
    } as any)
  }

  async updateProgress(
    progress: MissionProgressEntity
  ): Promise<MissionProgressEntity> {
    const id = progress.id || `${progress.driver_id}_${progress.mission_id}`
    const data = this.sanitize({
      ...progress,
      last_updated: Timestamp.now(),
      completed_at: progress.completed_at
        ? Timestamp.fromDate(progress.completed_at)
        : undefined
    })
    await setDoc(doc(this.progressRef, id), data, { merge: true })
    return progress
  }

  async getAllProgressByDriver(
    driver_id: string
  ): Promise<MissionProgressEntity[]> {
    const q = query(this.progressRef, where('driver_id', '==', driver_id))
    const snapshot = await getDocs(q)
    console.log('snapshot =>', snapshot)
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data()
      return new MissionProgressEntity({
        ...data,
        id: docSnap.id,
        completed_at: data.completed_at
          ? (data.completed_at as Timestamp).toDate()
          : undefined,
        last_updated: data.last_updated
          ? (data.last_updated as Timestamp).toDate()
          : undefined
      } as any)
    })
  }

  listenActiveMissions(
    onUpdate: (missions: MissionEntity[]) => void
  ): () => void {
    const q = query(this.missionsRef, where('is_active', '==', true))
    return onSnapshot(q, snapshot => {
      const missions = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        return new MissionEntity({
          ...data,
          id: docSnap.id,
          created_at: (data.created_at as Timestamp).toDate(),
          updated_at: data.updated_at
            ? (data.updated_at as Timestamp).toDate()
            : undefined
        } as any)
      })
      onUpdate(missions)
    })
  }

  listenDriverProgress(
    driver_id: string,
    onUpdate: (progress: MissionProgressEntity[]) => void
  ): () => void {
    const q = query(this.progressRef, where('driver_id', '==', driver_id))
    return onSnapshot(q, snapshot => {
      const progress = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        return new MissionProgressEntity({
          ...data,
          id: docSnap.id,
          completed_at: data.completed_at
            ? (data.completed_at as Timestamp).toDate()
            : undefined,
          last_updated: data.last_updated
            ? (data.last_updated as Timestamp).toDate()
            : undefined
        } as any)
      })
      onUpdate(progress)
    })
  }
}
