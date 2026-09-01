// modules/Api/firebase/admins.dao.ts
import type { IAdminRepository } from '@/core/interfaces/IAdminRepository'
import { AdminEntity, adminConverter } from '@/core/entities/Admin'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseAdminDAO
  extends BaseFirebaseDAO<AdminEntity>
  implements IAdminRepository
{
  constructor() {
    super(firebaseCollections.admins.root, adminConverter, 'adm', 'email')
  }

  /** Atalho de leitura — o motor já sabe procurar por campo. */
  async getByEmail(email: string): Promise<AdminEntity | null> {
    return this.getOneByField('email', email)
  }
}
