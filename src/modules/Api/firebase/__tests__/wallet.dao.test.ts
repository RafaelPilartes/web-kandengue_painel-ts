import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseWalletDAO } = await import('@/modules/Api/firebase/wallet.dao')
const { AppError } = await import('@/domain/errors/AppError')

const COLLECTION = 'wallets'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const driver = {
  id: 'drv-1',
  name: 'João Motorista',
  email: 'joao@kandengue.ao',
  phone: '+244900000000',
  status: 'active' as const,
  is_online: false
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseWalletDAO', () => {
  let dao: InstanceType<typeof FirebaseWalletDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseWalletDAO()
  })

  it('getById lê uma carteira semeada', async () => {
    await seed('wal-a', {
      user: driver,
      balance: 5000,
      status: 'active',
      currency: 'AOA',
      created_at: ts('2026-01-01')
    })

    const found = await dao.getById('wal-a')
    expect(found?.balance).toBe(5000)
    expect(found?.created_at).toBeInstanceOf(Date)
  })

  // ─── O teste que justifica esta task: a porta de escrita fica fechada ───

  it('create lança AppError(failed-precondition) e não escreve nada', async () => {
    await expect(
      dao.create({
        user: driver,
        balance: 100,
        status: 'active',
        currency: 'AOA'
      } as never)
    ).rejects.toThrow(AppError)
    await expect(
      dao.create({
        user: driver,
        balance: 100,
        status: 'active',
        currency: 'AOA'
      } as never)
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    const all = await dao.getAll()
    expect(all.data).toHaveLength(0)
  })

  it('update lança AppError(failed-precondition) e não altera o saldo', async () => {
    await seed('wal-a', {
      user: driver,
      balance: 5000,
      status: 'active',
      currency: 'AOA',
      created_at: ts('2026-01-01')
    })

    await expect(
      dao.update('wal-a', { balance: 999999 } as never)
    ).rejects.toThrow(AppError)
    await expect(
      dao.update('wal-a', { balance: 999999 } as never)
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    const snap = await getDoc(doc(testDb, `${COLLECTION}/wal-a`))
    expect(snap.data()?.balance).toBe(5000)
  })

  it('delete lança AppError(failed-precondition) e não remove a carteira', async () => {
    await seed('wal-a', {
      user: driver,
      balance: 5000,
      status: 'active',
      currency: 'AOA',
      created_at: ts('2026-01-01')
    })

    await expect(dao.delete('wal-a')).rejects.toThrow(AppError)
    await expect(dao.delete('wal-a')).rejects.toMatchObject({
      code: 'failed-precondition'
    })

    const snap = await getDoc(doc(testDb, `${COLLECTION}/wal-a`))
    expect(snap.exists()).toBe(true)
    expect(snap.data()?.balance).toBe(5000)
  })
})
