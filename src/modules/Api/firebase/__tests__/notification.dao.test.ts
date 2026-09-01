import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseNotificationDAO } =
  await import('@/modules/Api/firebase/notification.dao')

const COLLECTION = 'notifications'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseNotificationDAO', () => {
  let dao: InstanceType<typeof FirebaseNotificationDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseNotificationDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({
      title: 'Nova corrida disponível',
      message: 'Há uma corrida perto de si',
      type: 'ride',
      category: 'all'
    } as never)

    expect(created.id).toMatch(/^nft-/)
    const found = await dao.getById(created.id)
    expect(found?.title).toBe('Nova corrida disponível')
  })

  it('getAll ordena por created_at desc e pagina', async () => {
    await seed('nft-a', { title: 'Primeira', created_at: ts('2026-01-01') })
    await seed('nft-b', { title: 'Segunda', created_at: ts('2026-06-01') })

    const res = await dao.getAll()
    expect(res.data.map(n => n.id)).toEqual(['nft-b', 'nft-a'])
  })

  it('sent_at e created_at voltam como Date, não como Timestamp', async () => {
    await seed('nft-a', {
      title: 'Aviso',
      created_at: ts('2026-01-01'),
      sent_at: ts('2026-01-02')
    })

    const found = await dao.getById('nft-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
    expect(found?.sent_at).toBeInstanceOf(Date)
    expect(found?.sent_at).not.toBeInstanceOf(Timestamp)
  })

  // ─────────── Regressão: a pesquisa por `title` já funcionava e continua ───────────

  it('REGRESSÃO: a pesquisa por `title` continua a devolver resultados depois da migração', async () => {
    await seed('nft-a', {
      title: 'pagamento aprovado',
      created_at: ts('2026-01-01')
    })
    await seed('nft-b', {
      title: 'corrida cancelada',
      created_at: ts('2026-02-01')
    })

    const res = await dao.getAll({ searchTerm: 'pagamento' })

    expect(res.data.map(n => n.id)).toEqual(['nft-a'])
  })

  it('update e delete funcionam', async () => {
    await seed('nft-a', {
      title: 'Aviso',
      is_read: false,
      created_at: ts('2026-01-01')
    })

    const updated = await dao.update('nft-a', { is_read: true })
    expect(updated.is_read).toBe(true)

    await dao.delete('nft-a')
    expect(await dao.getById('nft-a')).toBeNull()
  })
})
