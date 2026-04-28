# Firebase — Painel Administrativo

## Serviços Utilizados

| Serviço              | Uso                                                    |
| -------------------- | ------------------------------------------------------ |
| **Firebase Auth**    | Login de admins                                        |
| **Firestore**        | Leitura de todas as coleções operacionais              |
| **Firebase Storage** | Leitura de documentos de motoristas e imagens de prova |

---

## Coleções Firestore Relevantes

O dashboard tem acesso de leitura (e escrita limitada) às seguintes coleções:

### `rides/{rideId}` → `RideInterface`

```typescript
// Idêntico ao app mobile — ver src/core/entities/Ride.ts
// Campos mais relevantes para o admin:
interface RideInterface {
  id?: string
  user: UserInterface // dados do passageiro
  driver?: DriverInterface
  pickup: GeoLocationType // { description, place_id, latitude, longitude }
  dropoff: GeoLocationType
  status: RideStatusType
  fare: RideFareInterface // { total, breakdown, payouts }
  distance: number
  duration: number
  type: RideType
  proof_pickup_photo?: string // imagem de prova de recolha
  proof_dropoff_photo?: string // imagem de prova de entrega
  cancel_reason?: string
  completed_at?: Date
  canceled_at?: Date
  created_at?: Date
}
```

### `drivers/{uid}` → `DriverInterface`

```typescript
// src/core/entities/Driver.ts
// (estende UserInterface)
interface DriverInterface extends UserInterface {
  is_online: boolean
  is_invisible: boolean
  vehicle?: VehicleInterface
  rating?: number
  current_location?: LocationType
}
```

### `wallets/{uid}` → `WalletInterface`

```typescript
// src/core/entities/Wallet.ts
interface WalletInterface {
  id?: string
  user: DriverInterface
  balance: number
  status: StatusEnumType // 'active' | 'inactive' | 'pending'
  currency: currencyEnumType // 'AOA' | 'USD'
  created_at?: Date
  updated_at?: Date
}
```

### `transactions/{txId}` → `TransactionInterface`

```typescript
// src/core/entities/Transaction.ts
interface TransactionInterface {
  id?: string
  wallet_id: string
  user: DriverInterface
  amount: number
  type: TransactionType // 'credit' | 'debit' | 'refund'
  category: TransactionCategoryType
  // 'wallet_topup' | 'ride_fee' | 'pension' | 'bonus' | 'refund'
  status: TransactionStatus // 'pending' | 'approved' | 'rejected'
  description?: string
  created_at?: Date
  updated_at?: Date
}
```

### `applications/{id}` → `ApplicationInterface`

Candidaturas de novos motoristas (geridas pelo website e visualizadas no admin):

```typescript
// src/core/entities/Application.ts
interface ApplicationEntity {
  id?: string
  entity_code?: string
  photo?: string
  first_name: string
  last_name: string
  email: string
  phone: string
  province: string
  gender: string
  type_candidacy?: string
  identity_card?: string
  identities_card?: string[]
  curriculum?: string
  vehicle_Doc?: string
  vehicle_photo?: string
  vehicle_docs?: string[]
  vehicle_photos?: string[]
  application_areas?: string
  status: ApplicationStatus // 'pending' | 'approved' | 'rejected'
  created_at?: Date
  updated_at?: Date
  firebase_uid?: string
}
```

### `missions/{id}` e `missionProgress/{id}`

```typescript
// src/core/entities/Mission.ts + MissionProgress.ts
// Missões/desafios para motoristas (ex: "Faz 10 corridas esta semana")
```

---

## Autenticação Admin

O dashboard verifica o `role` do utilizador após login:

```typescript
// services/auth.service.ts
const userDoc = await getDoc(doc(db, 'users', uid))
const role = userDoc.data()?.role

if (role !== 'admin') {
  await auth.signOut()
  throw new Error('Acesso não autorizado')
}
```

---

## Regras de Segurança

O dashboard usa o **Firebase Admin SDK** através da API Fastify para operações privilegiadas. As Firestore Security Rules restringem o acesso directo a admins autenticados:

```javascript
// Firestore rules (simplificado)
match /rides/{rideId} {
  allow read: if isAdmin();  // apenas admins lêem pelo dashboard
}

function isAdmin() {
  return request.auth != null
    && get(/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

**Anterior**: [04 — Setup Local](04-setup-local.md) | **Próximo**: [06 — Gestão de Estado](06-state-management.md)
