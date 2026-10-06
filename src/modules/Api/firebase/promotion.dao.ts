// modules/Api/firebase/promotion.dao.ts
//
// **Só leitura.** As escritas saíram daqui para a API
// (`modules/Api/rest/adminPromotion.dao.ts`): as regras passaram `promotions`
// e tudo o que está por baixo a `allow write: if false`, admin incluído.
//
// O que aqui estava, e porque é que já não está:
//
// - `create` montava o documento e os 10 shards de contagem num `writeBatch`.
//   Isso é agora `POST /api/v1/admin/promotions`, na mesma transacção do
//   registo de auditoria.
// - `update` traduzia `undefined` em `deleteField()` e apagava do patch o
//   `code`, os contadores e a autoria da criação. A primeira metade é agora a
//   regra "um opcional ausente é um opcional apagado" do serviço; a segunda
//   é o schema da API, que retira esses campos do corpo — a protecção deixou
//   de estar no cliente.
// - `setActive`, `addAllowedUser(sBulk)` e `removeAllowedUser` passaram a
//   rotas próprias, cada uma com a sua linha em `auditLogs`.
//
// Assenta no motor para tudo o que lê (`getAll`/`getById`/`count`/
// `getAllByField` e os listeners). O motor também traz `create`/`update`/
// `delete`, que o `IPromotionRepository` exclui do contrato — quem consome o
// repositório pela fábrica não lhes chega.
//
// Não se declara `searchField`. A página de promoções filtra por *substring*
// no cliente (`p.code.includes(t)`) e passa `searchTerm: undefined` de
// propósito — a pesquisa por prefixo do motor é outra semântica, e ligá-la
// aqui mudaria o que o admin vê.
import {
  collection,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  where
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import {
  PromotionEntity,
  PromotionUsageEntity,
  promotionConverter,
  promotionUsageConverter
} from '@/core/entities/Promotion'
import type { IPromotionRepository } from '@/core/interfaces/IPromotionRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { toDate } from '@/helpers/firestore'
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/interfaces'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export class FirebasePromotionDAO
  extends BaseFirebaseDAO<PromotionEntity>
  implements IPromotionRepository
{
  private readonly usagesRef = collection(
    db,
    firebaseCollections.promotionUsages.root
  )

  constructor() {
    super(firebaseCollections.promotions.root, promotionConverter, 'promo')
  }

  /** Atalho de leitura — o código normalizado é o id do documento. */
  async getByCode(code: string): Promise<PromotionEntity | null> {
    return this.getById(normalizeCode(code))
  }

  // ─────────────── Allowed users ───────────────

  async listAllowedUsers(code: string): Promise<AllowedUser[]> {
    try {
      const snap = await getDocs(
        collection(this.ref, normalizeCode(code), 'allowed_users')
      )
      return snap.docs.map(d => {
        const data = d.data()
        return {
          user_id: data.user_id ?? d.id,
          added_at: toDate(data.added_at) ?? new Date(),
          added_by: data.added_by ?? 'unknown'
        }
      })
    } catch (err) {
      return this.fail('listAllowedUsers', err)
    }
  }

  // ─────────────── Usages ───────────────

  async listUsages(
    code: string,
    limitValue = 100
  ): Promise<PromotionUsageEntity[]> {
    try {
      const snap = await getDocs(
        query(
          this.usagesRef,
          where('promotion_id', '==', normalizeCode(code)),
          orderBy('created_at', 'desc'),
          fbLimit(limitValue)
        )
      )
      return snap.docs.map(d => promotionUsageConverter.fromFirestore(d, {}))
    } catch (err) {
      return this.fail('listUsages', err)
    }
  }
}
