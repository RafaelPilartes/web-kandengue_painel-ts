// modules/Api/firebase/ride.dao.ts
import type { IRideRepository } from '@/core/interfaces/IRideRepository'
import type { RideDocEntity } from '@/core/entities/Ride'
import { rideConverter } from '@/core/entities/Ride'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ContactosPrivados } from '@/helpers/rideContacts'

export class FirebaseRideDAO
  extends BaseFirebaseDAO<RideDocEntity>
  implements IRideRepository
{
  /**
   * Os contactos de uma corrida, de `rides/{id}/private/contacts`.
   *
   * ── Porque é um método à parte, e não um campo da corrida ──
   * É **outro documento**, numa subcolecção que não herda as regras do pai
   * (foi o que a 3.2 ensinou, e o que o §0AB corrigiu): o admin lê-o, o
   * passageiro dono lê-o, o motorista atribuído lê só este — nunca os
   * códigos. Lê-se à parte porque se autoriza à parte.
   *
   * ⚠️ **Devolve `null` quando não existe, e isso é um caso normal**: as
   * corridas anteriores à 3.2 não têm o documento e **não migram** (§0A). Quem
   * chama junta-o com a cópia embutida pelo `contactosDaCorrida`.
   *
   * Sem converter: são quatro strings, e um converter para elas era cerimónia
   * sem conteúdo.
   */
  async getPrivateContacts(
    rideId: string
  ): Promise<ContactosPrivados | null> {
    const snap = await getDoc(
      /*
       * O nome do documento à mão: o `RIDE_PRIVATE_DOCS` entrou na lib depois
       * da 2.11.0, que é a que o painel fixa. Troca-se pela constante quando
       * o painel subir — e é por isso que está num sítio só.
       */
      doc(db, this.path, rideId, 'private', 'contacts')
    )
    return snap.exists() ? (snap.data() as ContactosPrivados) : null
  }

  constructor() {
    // `RideEntity` não tem campo de texto de topo útil para um admin
    // procurar uma corrida — os únicos são `status`, `type`, `otp_code` e
    // `cancel_reason`. `driver.email` é aninhado (ver `SearchField<T>` em
    // `BaseFirebaseDAO`) e é por onde o admin procura: pelo motorista.
    super(firebaseCollections.rides.root, rideConverter, 'rid', 'driver.email')
  }
}
