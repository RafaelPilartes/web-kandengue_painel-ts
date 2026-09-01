import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseTransactionDAO } =
  await import('@/modules/Api/firebase/transaction.dao')

const COLLECTION = 'transactions'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseTransactionDAO', () => {
  let dao: InstanceType<typeof FirebaseTransactionDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseTransactionDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({
      wallet_id: 'wal-1',
      user_id: 'usr-1',
      type: 'credit',
      category: 'wallet_topup',
      amount: 5000,
      status: 'success',
      description: 'carregamento via unitel money'
    } as never)

    const found = await dao.getById(created.id)
    expect(found?.amount).toBe(5000)
  })

  // ─────────── O prefixo corrigido: `tra`, não `wt` (das carteiras) ───────────

  it('CORRIGIDO: create gera id com prefixo tra-, não wt- (esse é das carteiras)', async () => {
    const created = await dao.create({
      wallet_id: 'wal-1',
      user_id: 'usr-1',
      type: 'credit',
      category: 'wallet_topup',
      amount: 1000,
      status: 'success'
    } as never)

    expect(created.id).toMatch(/^tra-/)
  })

  it('getAll ordena por created_at desc e pagina', async () => {
    await seed('tra-a', { description: 'primeira', created_at: ts('2026-01-01') })
    await seed('tra-b', { description: 'segunda', created_at: ts('2026-06-01') })

    const res = await dao.getAll()
    expect(res.data.map(t => t.id)).toEqual(['tra-b', 'tra-a'])
  })

  it('created_at e updated_at voltam como Date, não como Timestamp', async () => {
    await seed('tra-a', {
      description: 'aviso',
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-02')
    })

    const found = await dao.getById('tra-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
    expect(found?.updated_at).toBeInstanceOf(Date)
    expect(found?.updated_at).not.toBeInstanceOf(Timestamp)
  })

  // ─────────── Regressão: a pesquisa por `description` já funcionava ───────────

  it('REGRESSÃO: a pesquisa por `description` continua a devolver resultados depois da migração', async () => {
    await seed('tra-a', {
      description: 'carregamento unitel money',
      created_at: ts('2026-01-01')
    })
    await seed('tra-b', {
      description: 'pagamento de corrida',
      created_at: ts('2026-02-01')
    })

    const res = await dao.getAll({ searchTerm: 'carregamento' })

    expect(res.data.map(t => t.id)).toEqual(['tra-a'])
  })

  it('update e delete funcionam', async () => {
    await seed('tra-a', {
      description: 'aviso',
      status: 'pending',
      created_at: ts('2026-01-01')
    })

    const updated = await dao.update('tra-a', { status: 'success' })
    expect(updated.status).toBe('success')

    await dao.delete('tra-a')
    expect(await dao.getById('tra-a')).toBeNull()
  })
})
