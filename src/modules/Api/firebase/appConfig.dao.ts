// Não usa o BaseFirebaseDAO de propósito: lê e escreve um documento único
// e conhecido, não uma colecção. Paginação, pesquisa por prefixo e IDs
// gerados — tudo o que o motor traz — não se aplicam aqui.
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { IAppConfigRepository } from '@/core/interfaces/IAppConfigRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { IReferralSettings } from '@/interfaces/IPromotion'

function toDate(v: any): Date {
  if (!v) return new Date()
  if (v instanceof Date) return v
  if (typeof v?.toDate === 'function') return v.toDate()
  return new Date(v)
}

const REFERRAL_SETTINGS_DOC = 'referral_settings'

export class FirebaseAppConfigDAO implements IAppConfigRepository {
  async getReferralSettings(): Promise<IReferralSettings | null> {
    const snap = await getDoc(
      doc(db, firebaseCollections.appConfig.root, REFERRAL_SETTINGS_DOC)
    )
    if (!snap.exists()) return null
    const data = snap.data() as any
    return {
      minimum_withdrawal_amount: data.minimum_withdrawal_amount ?? 0,
      updated_by: data.updated_by ?? 'system',
      updated_at: toDate(data.updated_at)
    }
  }

  async updateReferralSettings(
    minimum_withdrawal_amount: number,
    updatedBy: string
  ): Promise<void> {
    await setDoc(
      doc(db, firebaseCollections.appConfig.root, REFERRAL_SETTINGS_DOC),
      {
        minimum_withdrawal_amount,
        updated_by: updatedBy,
        updated_at: Timestamp.now()
      },
      { merge: true }
    )
  }
}
