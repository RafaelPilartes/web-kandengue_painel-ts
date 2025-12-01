// src/services/seedFirestore.ts
import { db } from '@/config/firebase.config'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { rides } from '@/data/mockData'
import { setDoc, doc } from 'firebase/firestore'

// importa os mocks

// função genérica para salvar
async function addCollectionData<T>(
  collectionName: string,
  items: T[],
  idKey: keyof T
) {
  for (const item of items) {
    const itemId = String(item[idKey]) // pega o id que definimos no mock
    await setDoc(doc(db, collectionName, itemId), {
      ...item,
      created_at: (item as any)['created_at'] ?? new Date(),
      updated_at: new Date()
    })
    console.log(`✅ Adicionado em /${collectionName}/${itemId}`)
  }
}

// rodar o seed
export async function seedFirestore() {
  // await addCollectionData(firebaseCollections.users.root, users, 'id')
  // await addCollectionData(firebaseCollections.vehicles.root, vehicles, 'id')
  // await addCollectionData(firebaseCollections.drivers.root, drivers, 'id')
  // await addCollectionData(firebaseCollections.documents.root, documents, 'id')
  // await addCollectionData(firebaseCollections.transactions.root, transactions, 'id')
  // await addCollectionData(firebaseCollections.notifications.root, notifications, 'id')
  await addCollectionData(firebaseCollections.rides.root, rides, 'id')
  // await addCollectionData(firebaseCollections.rideRates.root, rideRates, 'id')
  // await addCollectionData(
  //   firebaseCollections.rideTrackings.root,
  //   rideTrackings,
  //   'id'
  // )
  // await addCollectionData(firebaseCollections.wallets.root, wallets, 'id')
  // await addCollectionData(
  //   firebaseCollections.requests.root,
  //   walletTopupRequests,
  //   'id'
  // )
}
