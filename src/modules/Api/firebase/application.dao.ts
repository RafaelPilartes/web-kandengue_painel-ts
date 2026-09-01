// modules/Api/firebase/application.dao.ts
import type { IApplicationRepository } from '@/core/interfaces/IApplicationRepository'
import {
  ApplicationEntity,
  applicationConverter
} from '@/core/entities/Application'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseApplicationDAO
  extends BaseFirebaseDAO<ApplicationEntity>
  implements IApplicationRepository
{
  constructor() {
    super(
      firebaseCollections.applications.root,
      applicationConverter,
      'appl',
      'email'
    )
  }

  /** Atalho de leitura — o motor já sabe procurar por campo. */
  async getByEmail(email: string): Promise<ApplicationEntity | null> {
    return this.getOneByField('email', email)
  }
}
