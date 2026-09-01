// modules/Api/firebase/wallet.dao.ts
import type { IWalletRepository } from '@/core/interfaces/IWalletRepository'
import { WalletEntity, walletConverter } from '@/core/entities/Wallet'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { ReadOnlyDAO } from './ReadOnlyDAO'

export class FirebaseWalletDAO
  extends ReadOnlyDAO<WalletEntity>
  implements IWalletRepository
{
  constructor() {
    // `user.email` é aninhado (ver `SearchField<T>` em `BaseFirebaseDAO`):
    // `WalletEntity.user` é um `DriverInterface`, que estende `UserInterface`
    // e por isso tem `email`. É por aqui que o admin procura uma carteira —
    // pelo email do motorista. O prefixo de ID nunca é usado: `create` está
    // fechado pelo `ReadOnlyDAO`.
    super(firebaseCollections.wallets.root, walletConverter, 'wal', 'user.email')
  }
}
