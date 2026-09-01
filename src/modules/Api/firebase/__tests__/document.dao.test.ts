import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseDocumentDAO } =
  await import('@/modules/Api/firebase/document.dao')

const COLLECTION = 'documents'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseDocumentDAO', () => {
  let dao: InstanceType<typeof FirebaseDocumentDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseDocumentDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({
      user: { id: 'usr-1', name: 'Ana' },
      type: 'driver_license',
      url: 'https://example.com/doc.png',
      status: 'pending'
    } as never)

    expect(created.id).toMatch(/^doc-/)
    const found = await dao.getById(created.id)
    expect(found?.type).toBe('driver_license')
    expect(found?.url).toBe('https://example.com/doc.png')
  })

  it('getAll ordena por created_at desc e pagina', async () => {
    await seed('doc-a', { type: 'id_front', created_at: ts('2026-01-01') })
    await seed('doc-b', { type: 'id_back', created_at: ts('2026-06-01') })

    const res = await dao.getAll()
    expect(res.data.map(d => d.id)).toEqual(['doc-b', 'doc-a'])
  })

  it('created_at e updated_at voltam como Date, não como Timestamp', async () => {
    await seed('doc-a', {
      type: 'id_front',
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-02-01')
    })

    const found = await dao.getById('doc-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
    expect(found?.updated_at).toBeInstanceOf(Date)
    expect(found?.updated_at).not.toBeInstanceOf(Timestamp)
  })

  // ─────────── O bug corrigido: pesquisa por `type` ───────────

  it('CORRIGIDO: a pesquisa por `type` devolve resultados (antes pesquisava por `email`, que não existe)', async () => {
    await seed('doc-a', { type: 'driver_license', created_at: ts('2026-01-01') })
    await seed('doc-b', { type: 'id_front', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'driver' })

    expect(res.data.map(d => d.id)).toEqual(['doc-a'])
  })

  it('update e delete funcionam', async () => {
    await seed('doc-a', {
      type: 'id_front',
      status: 'pending',
      created_at: ts('2026-01-01')
    })

    const updated = await dao.update('doc-a', { status: 'approved' })
    expect(updated.status).toBe('approved')

    await dao.delete('doc-a')
    expect(await dao.getById('doc-a')).toBeNull()
  })
})
