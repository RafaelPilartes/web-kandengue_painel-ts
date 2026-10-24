// Não usa o BaseFirebaseDAO de propósito: lê e escreve um documento único
// e conhecido, não uma colecção. Paginação, pesquisa por prefixo e IDs
// gerados — tudo o que o motor traz — não se aplicam aqui.
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type {
  IAppConfigRepository,
  IRegionsSettings
} from '@/core/interfaces/IAppConfigRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { IReferralSettings } from '@/interfaces/IPromotion'

function toDate(v: any): Date {
  if (!v) return new Date()
  if (v instanceof Date) return v
  if (typeof v?.toDate === 'function') return v.toDate()
  return new Date(v)
}

const REFERRAL_SETTINGS_DOC = 'referral_settings'
const REGIONS_DOC = 'regions'

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

  async getRegionsSettings(): Promise<IRegionsSettings> {
    const snap = await getDoc(
      doc(db, firebaseCollections.appConfig.root, REGIONS_DOC)
    )

    /*
     * ⚠️ **Absent means ON**, and the comparison is `!== false` — the exact
     * rule `RegionGateService.enforcing()` applies on the API. Reading this as
     * truthy, or defaulting to off, would make the screen say the gate is open
     * while the server is refusing rides.
     */
    if (!snap.exists()) {
      return { enforcement_enabled: true, exists: false }
    }

    const data = snap.data() as {
      enforcement_enabled?: unknown
      updated_by?: unknown
      updated_at?: unknown
    }
    return {
      enforcement_enabled: data.enforcement_enabled !== false,
      exists: true,
      updated_by:
        typeof data.updated_by === 'string' ? data.updated_by : undefined,
      updated_at: data.updated_at ? toDate(data.updated_at) : undefined
    }
  }

  async updateRegionsEnforcement(
    enabled: boolean,
    updatedBy: string
  ): Promise<void> {
    /*
     * `merge: true` because this document is **not** only the switch: the name
     * variations the lib does not know live in it too, and a full overwrite
     * would take them with it.
     */
    await setDoc(
      doc(db, firebaseCollections.appConfig.root, REGIONS_DOC),
      {
        enforcement_enabled: enabled,
        updated_by: updatedBy,
        updated_at: Timestamp.now()
      },
      { merge: true }
    )
  }
}
