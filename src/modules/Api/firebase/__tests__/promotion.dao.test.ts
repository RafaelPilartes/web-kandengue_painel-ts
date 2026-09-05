import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, getDoc, getDocs, collection, setDoc, Timestamp } from 'firebase/firestore'

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
const NUM_SHARDS = 10

const d = (iso: string) => new Date(iso)

/** Uma promoção mínima e válida, para não repetir o objecto em cada teste. */
function novaPromocao(over: Record<string, unknown> = {}) {
  return {
    code: 'verao10',
    type: 'percent',
    value: 10,
    used_count_approx: 0,
    reserved_count_approx: 0,
    valid_from: d('2026-01-01'),
    valid_until: d('2026-12-31'),
    active: true,
    rules: { first_ride_only: true },
    created_by: 'adm-1',
    created_at: d('2026-01-01'),
    ...over
  } as never
}

describe('FirebasePromotionDAO', () => {
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

  // ── O id é o código, não um id gerado ──

  it('create usa o código normalizado como id do documento', async () => {
    const criada = await dao.create(novaPromocao({ code: '  verao10 ' }))

    expect(criada.id).toBe('VERAO10')
    expect(criada.code).toBe('VERAO10')
    expect((await getDoc(doc(testDb, `${COLLECTION}/VERAO10`))).exists()).toBe(
      true
    )
  })

  it('getByCode normaliza antes de procurar', async () => {
    await dao.create(novaPromocao())

    expect((await dao.getByCode(' verao10 '))?.id).toBe('VERAO10')
    expect(await dao.getByCode('NAO-EXISTE')).toBeNull()
  })

  // ── A razão de este create não poder ser o do motor ──

  it('create inicializa os 10 shards de contagem a zero', async () => {
    await dao.create(novaPromocao())

    const shards = await getDocs(
      collection(testDb, `${COLLECTION}/VERAO10/counters`)
    )

    expect(shards.size).toBe(NUM_SHARDS)
    expect(shards.docs.map(s => s.id).sort()).toContain('shard_0')
    for (const s of shards.docs) {
      expect(s.data()).toEqual({ used_count: 0, reserved_count: 0 })
    }
  })

  it('create ignora contadores enviados pelo caller e começa a zero', async () => {
    const criada = await dao.create(
      novaPromocao({ used_count_approx: 999, reserved_count_approx: 42 })
    )

    expect(criada.used_count_approx).toBe(0)
    expect(criada.reserved_count_approx).toBe(0)
  })

  // ── A razão de este update não poder ser o do motor ──

  it('update apaga de facto um campo que o admin limpou', async () => {
    await dao.create(novaPromocao({ max_discount: 500 }))

    const atualizada = await dao.update('verao10', {
      max_discount: undefined
    })

    expect(atualizada.max_discount).toBeUndefined()
    // Não basta o objecto vir sem a chave: tem de ter saído do documento.
    expect(
      'max_discount' in (await getDoc(doc(testDb, `${COLLECTION}/VERAO10`))).data()!
    ).toBe(false)
  })

  it('update recusa alterar o código, os contadores e a auditoria de criação', async () => {
    // `create` carimba sempre `created_at` com a hora do servidor e ignora o
    // que o caller enviou — por isso a referência é o que o create devolveu,
    // não a data do objecto de entrada.
    const criada = await dao.create(novaPromocao())

    const atualizada = await dao.update('verao10', {
      code: 'OUTRO',
      used_count_approx: 999,
      reserved_count_approx: 999,
      created_by: 'intruso',
      created_at: d('2020-01-01')
    } as never)

    expect(atualizada.code).toBe('VERAO10')
    expect(atualizada.used_count_approx).toBe(0)
    expect(atualizada.reserved_count_approx).toBe(0)
    expect(atualizada.created_by).toBe('adm-1')
    expect(atualizada.created_at).toEqual(criada.created_at)
  })

  it('update sem rules deixa as rules existentes intactas', async () => {
    await dao.create(novaPromocao())

    const atualizada = await dao.update('verao10', { value: 20 })

    expect(atualizada.value).toBe(20)
    expect(atualizada.rules).toEqual({ first_ride_only: true })
  })

  it('update com rules substitui-as por inteiro', async () => {
    await dao.create(novaPromocao())

    const atualizada = await dao.update('verao10', {
      rules: { min_account_age_days: 7 } as never
    })

    expect(atualizada.rules).toEqual({ min_account_age_days: 7 })
  })

  // ── O que passou a vir do motor ──

  it('getAll ordena por created_at desc', async () => {
    // `create` carimba `created_at` com Timestamp.now() e ignora o valor
    // enviado, por isso a ordem observável é a de criação: B depois de A.
    await dao.create(novaPromocao({ code: 'A' }))
    await dao.create(novaPromocao({ code: 'B' }))

    expect((await dao.getAll()).data.map(p => p.id)).toEqual(['B', 'A'])
  })

  it('setActive alterna sem tocar no resto', async () => {
    await dao.create(novaPromocao())

    await dao.setActive('verao10', false)

    const p = await dao.getByCode('verao10')
    expect(p?.active).toBe(false)
    expect(p?.value).toBe(10)
  })

  // ── Subcolecção de utilizadores permitidos ──

  it('addAllowedUsersBulk e listAllowedUsers percorrem a subcolecção', async () => {
    await dao.create(novaPromocao())

    await dao.addAllowedUsersBulk('verao10', ['us-1', 'us-2'], 'adm-1')

    const permitidos = await dao.listAllowedUsers('verao10')
    expect(permitidos.map(u => u.user_id).sort()).toEqual(['us-1', 'us-2'])
    expect(permitidos[0].added_by).toBe('adm-1')

    await dao.removeAllowedUser('verao10', 'us-1')
    expect((await dao.listAllowedUsers('verao10')).map(u => u.user_id)).toEqual(
      ['us-2']
    )
  })

  it('addAllowedUsersBulk com lista vazia não escreve nada', async () => {
    await dao.create(novaPromocao())

    await dao.addAllowedUsersBulk('verao10', [], 'adm-1')

    expect(await dao.listAllowedUsers('verao10')).toEqual([])
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

    const usos = await dao.listUsages(' verao10 ')

    expect(usos.map(u => u.id)).toEqual(['u-1'])
    expect(usos[0].created_at).toEqual(d('2026-02-01'))
  })
})
