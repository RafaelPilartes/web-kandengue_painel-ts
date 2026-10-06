// modules/Api/firebase/missionProgress.dao.ts
import { getDocs, limit as fbLimit, query, where } from 'firebase/firestore'
import type { IMissionProgressRepository } from '@/core/interfaces/IMissionProgressRepository'
import {
  MissionProgressEntity,
  missionProgressConverter
} from '@/core/entities/MissionProgress'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

/**
 * **Só leitura.** O `updateProgress` saiu daqui para a API — ver
 * `IMissionProgressRepository` para o porquê.
 *
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

  /**
   * O par driver/mission, por query e não pelo id composto
   * (`{driver_id}_{mission_id}`): há documentos em produção com id gerado,
   * de antes da convenção. É o mesmo recuo que o `payMissionBonus` da API faz.
   */
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
