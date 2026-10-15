import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { documentUseCase } = await import('@/domain/usecases/documentUseCase')

const COLLECTION = 'documents'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

const base = {
  user: { id: 'dri-1' },
  type: 'driver_license',
  url: 'https://example/l.pdf',
  status: 'approved',
  created_at: ts('2026-01-01')
}

/**
 * The documents of a deleted account must not reach the panel.
 *
 * ⚠️ **Decided 2026-10-15, and until this round it was a decision with no
 * implementation.** The API wrote `account_deleted` and nothing read it: the
 * documents kept appearing in the driver's page exactly as before. Nothing
 * failed — which is why it needed a test and not a reading of the code.
 *
 * ⚠️ **And the filter is in the client, not in a `where`.** A
 * `where('account_deleted','!=',true)` excludes documents **missing** the
 * field, which is every normal document: it would have hidden the whole
 * collection and shown only the deleted ones. These tests pin the direction.
 */
describe('documentUseCase — documentos de contas eliminadas', () => {
  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
  })

  it('executeGetAll esconde os marcados e mostra os outros', async () => {
    await seed('doc-live', base)
    await seed('doc-del', { ...base, account_deleted: true })

    const ids = (await documentUseCase.executeGetAll()).data.map(d => d.id)

    expect(ids).toEqual(['doc-live'])
  })

  /* O caminho que o ecrã do motorista usa de facto. */
  it('executeGetAllByField esconde os marcados', async () => {
    await seed('doc-live', base)
    await seed('doc-del', { ...base, account_deleted: true })

    const { data } = await documentUseCase.executeGetAllByField(
      'user.id',
      'dri-1'
    )

    expect(data.map(d => d.id)).toEqual(['doc-live'])
  })

  /*
   * ⚠️ A direcção, explicitamente: um documento **sem** o campo é de uma
   * conta viva e tem de aparecer. É o caso que um `where` teria invertido.
   */
  it('mostra os documentos que não têm o campo', async () => {
    await seed('doc-a', base)
    await seed('doc-b', { ...base, type: 'insurance' })

    const ids = (await documentUseCase.executeGetAll()).data.map(d => d.id)

    expect(ids.sort()).toEqual(['doc-a', 'doc-b'])
  })

  it('account_deleted false não esconde nada', async () => {
    await seed('doc-live', { ...base, account_deleted: false })

    expect((await documentUseCase.executeGetAll()).data).toHaveLength(1)
  })

  /*
   * O documento continua lá — é a decisão: fica guardado por causa do
   * licenciamento, só não se vê no painel.
   */
  it('o documento marcado continua na colecção', async () => {
    await seed('doc-del', { ...base, account_deleted: true })

    expect((await documentUseCase.executeGetAll()).data).toHaveLength(0)
    expect(
      (await documentUseCase.executeGetById('doc-del'))?.status
    ).toBe('approved')
  })
})
