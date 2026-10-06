import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebasePromotionDAO } =
  await import('@/modules/Api/firebase/promotion.dao')

const COLLECTION = 'promotions'
const USAGES = 'promotion_usages' // ver firebaseCollections: snake_case

const d = (iso: string) => new Date(iso)

/*
 * ⚠️ **Este DAO é só de leitura.** As escritas passaram para a API
 * (`/api/v1/admin/promotions*`) e as regras fecharam `promotions` ao
 * cliente, admin incluído — o que aqui se tentasse escrever rebentava com
 * `permission-denied` em produção.
 *
 * Os testes que havia do `create` (id = código, os 10 shards, contadores
 * ignorados), do `update` (`deleteField`, código e contadores protegidos,
 * `rules` substituídas por inteiro), do `setActive` e dos permitidos estão
 * agora no `promotion-admin.service.test.ts` da API, onde esse
 * comportamento passou a viver. **Não os reintroduzir aqui**: um teste que
 * escreve directamente neste DAO passa contra o emulador (que o teste corre
 * sem regras) e descreve um caminho que produção nega.
 *
 * Por isso a semente é escrita com `setDoc`, não pelo DAO.
 */
async function seedPromotion(
  code: string,
  over: Record<string, unknown> = {}
) {
  await setDoc(doc(testDb, `${COLLECTION}/${code}`), {
    id: code,
    code,
    type: 'percentage',
    value: 10,
    used_count_approx: 0,
    reserved_count_approx: 0,
    valid_from: Timestamp.fromDate(d('2026-01-01')),
    valid_until: Timestamp.fromDate(d('2026-12-31')),
    active: true,
    rules: { has_specific_users: true },
    created_by: 'adm-1',
    created_at: Timestamp.fromDate(d('2026-01-01')),
    ...over
  })
}

describe('FirebasePromotionDAO (leitura)', () => {
  let dao: InstanceType<typeof FirebasePromotionDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    // `clearCollection` apaga documentos de raiz; apagar um documento no
    // Firestore NÃO apaga as suas subcolecções. Sem limpar `allowed_users`
    // e `counters` à mão, um teste vê os utilizadores permitidos do
    // anterior.
    for (const code of ['VERAO10', 'A', 'B']) {
      await clearCollection(`${COLLECTION}/${code}/allowed_users`)
      await clearCollection(`${COLLECTION}/${code}/counters`)
    }
    await clearCollection(COLLECTION)
    await clearCollection(USAGES)
    dao = new FirebasePromotionDAO()
  })

  // ── O id é o código, e é por aí que se lê ──

  it('getByCode normaliza antes de procurar', async () => {
    await seedPromotion('VERAO10')

    expect((await dao.getByCode(' verao10 '))?.id).toBe('VERAO10')
    expect(await dao.getByCode('NAO-EXISTE')).toBeNull()
  })

  it('getByCode converte as três datas do documento', async () => {
    await seedPromotion('VERAO10')

    const p = await dao.getByCode('VERAO10')

    expect(p?.valid_from).toEqual(d('2026-01-01'))
    expect(p?.valid_until).toEqual(d('2026-12-31'))
    expect(p?.created_at).toEqual(d('2026-01-01'))
  })

  // ── O que vem do motor ──

  it('getAll ordena por created_at desc', async () => {
    await seedPromotion('A', {
      created_at: Timestamp.fromDate(d('2026-01-01'))
    })
    await seedPromotion('B', {
      created_at: Timestamp.fromDate(d('2026-02-01'))
    })

    expect((await dao.getAll()).data.map(p => p.id)).toEqual(['B', 'A'])
  })

  // ── Subcolecção de utilizadores permitidos ──

  it('listAllowedUsers percorre a subcolecção', async () => {
    await seedPromotion('VERAO10')
    for (const uid of ['us-1', 'us-2']) {
      await setDoc(doc(testDb, `${COLLECTION}/VERAO10/allowed_users/${uid}`), {
        user_id: uid,
        added_at: Timestamp.fromDate(d('2026-02-01')),
        added_by: 'adm-1'
      })
    }

    const permitidos = await dao.listAllowedUsers(' verao10 ')

    expect(permitidos.map(u => u.user_id).sort()).toEqual(['us-1', 'us-2'])
    expect(permitidos[0].added_by).toBe('adm-1')
    expect(permitidos[0].added_at).toEqual(d('2026-02-01'))
  })

  it('listAllowedUsers numa promoção sem lista devolve vazio', async () => {
    await seedPromotion('VERAO10')

    expect(await dao.listAllowedUsers('VERAO10')).toEqual([])
  })

  /**
   * Documentos antigos da subcolecção podem não ter `user_id` nem `added_by`
   * — o id do documento é a fonte fiável do primeiro.
   */
  it('listAllowedUsers recua para o id do documento e para "unknown"', async () => {
    await seedPromotion('VERAO10')
    await setDoc(doc(testDb, `${COLLECTION}/VERAO10/allowed_users/us-velho`), {})

    const [permitido] = await dao.listAllowedUsers('VERAO10')

    expect(permitido.user_id).toBe('us-velho')
    expect(permitido.added_by).toBe('unknown')
  })

  // ── Usages, na colecção de raiz separada ──

  it('listUsages filtra pelo promotion_id normalizado', async () => {
    await setDoc(doc(testDb, `${USAGES}/u-1`), {
      promotion_id: 'VERAO10',
      user_id: 'us-1',
      ride_id: 'rid-1',
      status: 'confirmed',
      discount_applied: 100,
      grace_cancel_count: 0,
      driver_cancel_counts: {},
      cancellation_history: [],
      expires_at: null,
      created_at: Timestamp.fromDate(d('2026-02-01')),
      updated_at: Timestamp.fromDate(d('2026-02-01'))
    })
    await setDoc(doc(testDb, `${USAGES}/u-2`), {
      promotion_id: 'OUTRA',
      user_id: 'us-2',
      ride_id: null,
      status: 'confirmed',
      discount_applied: 50,
      grace_cancel_count: 0,
      driver_cancel_counts: {},
      cancellation_history: [],
      expires_at: null,
      created_at: Timestamp.fromDate(d('2026-03-01')),
      updated_at: Timestamp.fromDate(d('2026-03-01'))
    })

    const usages = await dao.listUsages(' verao10 ')

    expect(usages.map(u => u.id)).toEqual(['u-1'])
    expect(usages[0].created_at).toEqual(d('2026-02-01'))
  })
})
