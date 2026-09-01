// modules/Api/firebase/walletTopupRequest.dao.ts
import type { IWalletTopupRequestRepository } from '@/core/interfaces/IWalletTopupRequestRepository'
import {
  WalletTopupRequestEntity,
  walletTopupRequestConverter
} from '@/core/entities/WalletTopupRequest'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseWalletTopupRequestDAO
  extends BaseFirebaseDAO<WalletTopupRequestEntity>
  implements IWalletTopupRequestRepository
{
  constructor() {
    // O antigo pesquisava por `email`, que esta entidade não tem — devolvia
    // sempre vazio. `phone_number` é por onde um admin procura um carregamento.
    super(
      firebaseCollections.requests.root,
      walletTopupRequestConverter,
      'wtopr',
      'phone_number'
    )
  }
}
