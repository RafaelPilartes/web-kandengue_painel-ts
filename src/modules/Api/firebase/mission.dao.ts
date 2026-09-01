// modules/Api/firebase/mission.dao.ts
import type { IMissionRepository } from '@/core/interfaces/IMissionRepository'
import { MissionEntity, missionConverter } from '@/core/entities/Mission'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseMissionDAO
  extends BaseFirebaseDAO<MissionEntity>
  implements IMissionRepository
{
  constructor() {
    // Sem searchField: o DAO actual não faz prefix-search sobre missões.
    super(firebaseCollections.missions.root, missionConverter, 'miss')
  }
}
