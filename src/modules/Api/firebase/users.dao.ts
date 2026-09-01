// modules/Api/firebase/users.dao.ts
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { deleteUser } from 'firebase/auth'
import type { IUserRepository } from '@/core/interfaces/IUserRepository'
import { UserEntity, userConverter } from '@/core/entities/User'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { auth } from '@/config/firebase.config'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseUserDAO
  extends BaseFirebaseDAO<UserEntity>
  implements IUserRepository
{
  constructor() {
    super(firebaseCollections.users.root, userConverter, 'us', 'email')
  }

  /** Atalho de leitura — o motor já sabe procurar por campo. */
  async getByEmail(email: string): Promise<UserEntity | null> {
    return this.getOneByField('email', email)
  }

  /**
   * Porta o comportamento do DAO antigo tal e qual: marca `status: 'deleted'`
   * e, se `firebaseUid` for o do utilizador com sessão iniciada, apaga também
   * a conta no Firebase Auth. No painel quem tem sessão é o admin, portanto
   * esse segundo ramo só dispara se um admin se apagar a si próprio.
   */
  async softDelete(id: string, firebaseUid?: string): Promise<void> {
    try {
      await updateDoc(doc(this.ref, id), {
        status: 'deleted',
        updated_at: serverTimestamp()
      })

      if (firebaseUid && auth.currentUser?.uid === firebaseUid) {
        await deleteUser(auth.currentUser)
      }
    } catch (err) {
      this.fail('softDelete', err)
    }
  }
}
