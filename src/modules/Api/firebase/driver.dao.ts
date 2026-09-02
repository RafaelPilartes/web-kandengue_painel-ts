// modules/Api/firebase/driver.dao.ts
import {
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { deleteUser } from 'firebase/auth'
import type { IDriverRepository } from '@/core/interfaces/IDriverRepository'
import { DriverEntity, driverConverter } from '@/core/entities/Driver'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { auth } from '@/config/firebase.config'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseDriverDAO
  extends BaseFirebaseDAO<DriverEntity>
  implements IDriverRepository
{
  constructor() {
    super(firebaseCollections.drivers.root, driverConverter, 'dri', 'email')
  }

  /** Atalho de leitura — o motor já sabe procurar por campo. */
  async getByEmail(email: string): Promise<DriverEntity | null> {
    return this.getOneByField('email', email)
  }

  /**
   * Porta o comportamento do DAO antigo tal e qual: marca `status: 'deleted'`
   * e, se `firebaseUid` for o do utilizador com sessão iniciada, apaga também
   * a conta no Firebase Auth.
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

  /** Escuta em tempo real os motoristas online — usado no mapa do painel. */
  listenOnlineDrivers(
    onUpdate: (drivers: DriverEntity[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    const q = query(
      this.ref,
      where('is_online', '==', true),
      orderBy('updated_at', 'desc')
    )

    return onSnapshot(
      q,
      snapshot => {
        onUpdate(snapshot.docs.map(docSnap => this.toEntity(docSnap)))
      },
      err => this.onListenError('listenOnlineDrivers', err, onError)
    )
  }
}
