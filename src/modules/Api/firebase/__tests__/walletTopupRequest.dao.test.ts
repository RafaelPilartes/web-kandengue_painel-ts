import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseWalletTopupRequestDAO } =
  await import('@/modules/Api/firebase/walletTopupRequest.dao')

const COLLECTION = 'topupRequests'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const base = {
  wallet_id: 'wlt-1',
  user_id: 'usr-1',
  amount: 5000,
  currency: 'AOA',
  method: 'unitel_money',
  status: 'pending',
  idempotency_key: 'idem-1'
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseWalletTopupRequestDAO', () => {
  let dao: InstanceType<typeof FirebaseWalletTopupRequestDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseWalletTopupRequestDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({
      ...base,
      phone_number: '923000000'
    } as never)

    expect(created.id).toMatch(/^wtopr-/)
    const found = await dao.getById(created.id)
    expect(found?.phone_number).toBe('923000000')
  })

  it('todas as quatro datas voltam como Date, não como Timestamp', async () => {
    await seed('wtopr-a', {
      ...base,
      phone_number: '923000000',
      created_at: ts('2026-01-01'),
      processed_at: ts('2026-01-02'),
      confirmed_at: ts('2026-01-03'),
      updated_at: ts('2026-01-04')
    })

    const found = await dao.getById('wtopr-a')

    for (const field of [
      'created_at',
      'processed_at',
      'confirmed_at',
      'updated_at'
    ] as const) {
      expect(found?.[field]).toBeInstanceOf(Date)
      expect(found?.[field]).not.toBeInstanceOf(Timestamp)
    }
  })

  it('update e delete funcionam', async () => {
    await seed('wtopr-a', {
      ...base,
      phone_number: '923000000',
      created_at: ts('2026-01-01')
    })

    const updated = await dao.update('wtopr-a', { status: 'success' })
    expect(updated.status).toBe('success')

    await dao.delete('wtopr-a')
    expect(await dao.getById('wtopr-a')).toBeNull()
  })

  // ─────────── O bug característico: pesquisa por email devolvia sempre vazio ───────────

  it('CORRIGIDO: pesquisar por phone_number devolve resultados (antes procurava por email, que não existe)', async () => {
    await seed('wtopr-a', {
      ...base,
      phone_number: '923111111',
      created_at: ts('2026-01-01')
    })
    await seed('wtopr-b', {
      ...base,
      phone_number: '924222222',
      created_at: ts('2026-01-02')
    })

    const res = await dao.getAll({ searchTerm: '923111111' })

    expect(res.data.map(w => w.id)).toEqual(['wtopr-a'])
  })
})
