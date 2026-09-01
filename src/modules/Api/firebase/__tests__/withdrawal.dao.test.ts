import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseWithdrawalDAO } = await import(
  '@/modules/Api/firebase/withdrawal.dao'
)
const { AppError } = await import('@/domain/errors/AppError')

const COLLECTION = 'withdrawal_requests'
const EARNINGS_COLLECTION = 'referral_earnings'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const paymentDetails = { method: 'bank_transfer', account: '123456789' }

async function seedWithdrawal(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

async function seedEarning(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${EARNINGS_COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseWithdrawalDAO', () => {
  let dao: InstanceType<typeof FirebaseWithdrawalDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    await clearCollection(EARNINGS_COLLECTION)
    dao = new FirebaseWithdrawalDAO()
  })

  it('getById lê um saque semeado', async () => {
    await seedWithdrawal('wdr-a', {
      user_id: 'usr-1',
      earning_ids: ['ear-1'],
      total_amount: 1000,
      status: 'pending',
      payment_details: paymentDetails,
      created_at: ts('2026-01-01')
    })

    const found = await dao.getById('wdr-a')
    expect(found?.total_amount).toBe(1000)
    expect(found?.created_at).toBeInstanceOf(Date)
  })

  it('countByStatus delega no count() do motor', async () => {
    await seedWithdrawal('wdr-a', {
      user_id: 'usr-1',
      earning_ids: [],
      total_amount: 1000,
      status: 'pending',
      payment_details: paymentDetails,
      created_at: ts('2026-01-01')
    })
    await seedWithdrawal('wdr-b', {
      user_id: 'usr-2',
      earning_ids: [],
      total_amount: 2000,
      status: 'paid',
      payment_details: paymentDetails,
      created_at: ts('2026-01-02')
    })

    expect(await dao.countByStatus('pending')).toBe(1)
    expect(await dao.countByStatus('paid')).toBe(1)
    expect(await dao.countByStatus('rejected')).toBe(0)
  })

  it('getEarningsByIds resolve da colecção referral_earnings', async () => {
    await seedEarning('ear-1', {
      referrer_user_id: 'usr-1',
      referred_user_id: 'usr-2',
      promotion_id: 'promo-1',
      ride_id: 'ride-1',
      reward_type: 'fixed',
      reward_value: 500,
      reward_amount: 500,
      status: 'requested',
      requested_at: ts('2026-01-01'),
      created_at: ts('2026-01-01')
    })
    await seedEarning('ear-2', {
      referrer_user_id: 'usr-1',
      referred_user_id: 'usr-3',
      promotion_id: 'promo-1',
      ride_id: 'ride-2',
      reward_type: 'fixed',
      reward_value: 500,
      reward_amount: 500,
      status: 'paid',
      paid_at: ts('2026-01-05'),
      created_at: ts('2026-01-01')
    })

    const earnings = await dao.getEarningsByIds(['ear-1', 'ear-2'])
    expect(earnings).toHaveLength(2)
    expect(earnings.map(e => e.id).sort()).toEqual(['ear-1', 'ear-2'])
    const paid = earnings.find(e => e.id === 'ear-2')
    expect(paid?.paid_at).toBeInstanceOf(Date)
  })

  it('getEarningsByIds devolve [] para lista vazia sem consultar o Firestore', async () => {
    expect(await dao.getEarningsByIds([])).toEqual([])
  })

  // ─── O teste que justifica esta task: a porta de escrita fica fechada ───

  it('create lança AppError(failed-precondition) e não escreve nada', async () => {
    await expect(
      dao.create({
        user_id: 'usr-1',
        earning_ids: [],
        total_amount: 100,
        status: 'pending',
        payment_details: paymentDetails
      } as never)
    ).rejects.toMatchObject({ code: 'failed-precondition' })
    await expect(
      dao.create({
        user_id: 'usr-1',
        earning_ids: [],
        total_amount: 100,
        status: 'pending',
        payment_details: paymentDetails
      } as never)
    ).rejects.toThrow(AppError)

    const all = await dao.getAll()
    expect(all.data).toHaveLength(0)
  })

  it('update lança AppError(failed-precondition) e não altera o saque', async () => {
    await seedWithdrawal('wdr-a', {
      user_id: 'usr-1',
      earning_ids: [],
      total_amount: 1000,
      status: 'pending',
      payment_details: paymentDetails,
      created_at: ts('2026-01-01')
    })

    await expect(
      dao.update('wdr-a', { status: 'paid' } as never)
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    const snap = await getDoc(doc(testDb, `${COLLECTION}/wdr-a`))
    expect(snap.data()?.status).toBe('pending')
  })

  it('delete lança AppError(failed-precondition) e não remove o saque', async () => {
    await seedWithdrawal('wdr-a', {
      user_id: 'usr-1',
      earning_ids: [],
      total_amount: 1000,
      status: 'pending',
      payment_details: paymentDetails,
      created_at: ts('2026-01-01')
    })

    await expect(dao.delete('wdr-a')).rejects.toMatchObject({
      code: 'failed-precondition'
    })

    const snap = await getDoc(doc(testDb, `${COLLECTION}/wdr-a`))
    expect(snap.exists()).toBe(true)
  })
})
