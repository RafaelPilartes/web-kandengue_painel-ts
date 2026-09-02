// modules/Api/firebase/missionProgress.dao.ts
import {
  doc,
  getDocs,
  limit as fbLimit,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore'
import type { IMissionProgressRepository } from '@/core/interfaces/IMissionProgressRepository'
import {
  MissionProgressEntity,
  missionProgressConverter
} from '@/core/entities/MissionProgress'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { AppError } from '@/domain/errors/AppError'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

/**
 * Ao contrário do resto das entidades deste projecto, esta colecção não tem
 * `created_at` — `getAll`/`listenAll` herdados (que ordenam por `created_at`
 * por omissão) devolveriam sempre vazio aqui. Usar os métodos próprios
 * abaixo para ler progresso, ou passar `orderBy: 'last_updated'` a `getAll`.
 */
export class FirebaseMissionProgressDAO
  extends BaseFirebaseDAO<MissionProgressEntity>
  implements IMissionProgressRepository
{
  constructor() {
    // Sem searchField: não há prefix-search sobre progresso de missões.
    super(
      firebaseCollections.missionProgress.root,
      missionProgressConverter,
      'mprog',
      // Sem campo de pesquisa: a entidade não tem nenhum de texto útil.
      undefined,
      // Esta colecção NÃO tem `created_at` — as suas datas são `completed_at`
      // e `last_updated`. Sem declarar isto, a ordenação por omissão do motor
      // excluiria todos os documentos e o `getAll` devolveria vazio.
      'last_updated'
    )
  }

  /** ID composto por convenção — a API usa a mesma em MissionProgressRepository. */
  private compositeId(driverId: string, missionId: string): string {
    return `${driverId}_${missionId}`
  }

  async getProgress(
    driverId: string,
    missionId: string
  ): Promise<MissionProgressEntity | null> {
    try {
      const snap = await getDocs(
        query(
          this.ref,
          where('driver_id', '==', driverId),
          where('mission_id', '==', missionId),
          fbLimit(1)
        )
      )
      return snap.empty ? null : this.toEntity(snap.docs[0])
    } catch (err) {
      this.fail('getProgress', err)
    }
  }

  /**
   * Upsert com ID composto — não é o `create` do motor, que geraria um ID
   * com prefixo e partiria a convenção que a API espera.
   */
  async updateProgress(
    progress: MissionProgressEntity
  ): Promise<MissionProgressEntity> {
    try {
      const id =
        progress.id || this.compositeId(progress.driver_id, progress.mission_id)

      await setDoc(
        doc(this.ref, id),
        { ...progress, id, last_updated: serverTimestamp() },
        { merge: true }
      )

      const updated = await this.getById(id)
      if (!updated) {
        this.fail(
          'updateProgress',
          new AppError('not-found', 'progresso não encontrado após upsert')
        )
      }
      return updated
    } catch (err) {
      this.fail('updateProgress', err)
    }
  }

  async getAllProgressByDriver(
    driverId: string
  ): Promise<MissionProgressEntity[]> {
    try {
      const snap = await getDocs(
        query(this.ref, where('driver_id', '==', driverId))
      )
      return snap.docs.map(d => this.toEntity(d))
    } catch (err) {
      this.fail('getAllProgressByDriver', err)
    }
  }
}
