// src/services/seedFirestore.ts
import { db } from '@/config/firebase.config'
import {
  users,
  vehicles,
  drivers,
  documents,
  transactions,
  notifications,
  rides,
  rideRates,
  rideTracking,
  wallets
} from '@/data/mockData'
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
  await addCollectionData('users', users, 'id')
  await addCollectionData('vehicles', vehicles, 'id')
  await addCollectionData('drivers', drivers, 'id')
  await addCollectionData('documents', documents, 'id')
  await addCollectionData('transactions', transactions, 'id')
  await addCollectionData('notifications', notifications, 'id')
  await addCollectionData('rides', rides, 'id')
  await addCollectionData('rideRates', rideRates, 'id')
  await addCollectionData('rideTracking', rideTracking, 'id')
  await addCollectionData('wallets', wallets, 'id')
}
